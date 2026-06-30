"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModerationResult, VoiceDiagnosticsShareResult, VoiceQosExportResult, VoiceQosRecommendationsResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";
import {
  getDiagnosticsExpandedPreference,
  setDiagnosticsExpandedPreference
} from "@/lib/voice-preferences";
import { useWebRtcGroundwork } from "@/hooks/useWebRtcGroundwork";
import { VoiceHistoryChart } from "./voice-history-chart";
import { VoiceIncidentTimeline } from "./voice-incident-timeline";
import { VoiceTroubleshootingWizard } from "./voice-troubleshooting-wizard";
import { Waveform } from "./waveform";

interface VoiceLinkPanelProps {
  enabled: boolean;
  incomingSignal: WebRtcSignalMessage | null;
  onSendSignal: (signal: WebRtcSignalMessage) => void | Promise<void>;
  onModerateTranscript: (transcript: string) => Promise<ModerationResult>;
  onReportQosSample: (sample: VoiceQosSample) => Promise<VoiceQosReportResult>;
  onLoadQosHistory: () => Promise<VoiceQosSample[]>;
  onFetchRecommendations: (context: Record<string, unknown>) => Promise<VoiceQosRecommendationsResult>;
  onExportDiagnostics: () => Promise<VoiceQosExportResult>;
  onCreateShare: () => Promise<VoiceDiagnosticsShareResult>;
  onSystemNotice: (text: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  disabled: "Live mode unavailable",
  idle: "Voice channel idle",
  priming: "Preparing microphone...",
  negotiating: "Negotiating secure voice link...",
  connected: "Voice channel connected",
  reconnecting: "Reconnecting voice link...",
  ready: "Mic ready — waiting for signal lock",
  error: "Voice link error"
};

const PRESENCE_LABELS: Record<string, string> = {
  offline: "Offline",
  idle: "Idle",
  tuning: "Tuning",
  listening: "Listening",
  speaking: "Speaking",
  reconnecting: "Reconnecting"
};

const PERMISSION_LABELS: Record<string, string> = {
  unknown: "Unknown",
  prompt: "Prompt",
  granted: "Granted",
  denied: "Denied",
  unsupported: "Unsupported"
};

function formatMetric(value: number | null, suffix: string) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)}${suffix}`;
}

function qualityLabel(rtt: number | null, jitter: number | null, loss: number | null) {
  if (rtt === null && jitter === null && loss === null) {
    return "Unknown";
  }

  const safeRtt = rtt ?? 999;
  const safeJitter = jitter ?? 999;
  const safeLoss = loss ?? 999;

  if (safeRtt < 90 && safeJitter < 12 && safeLoss < 3) {
    return "Stable";
  }

  if (safeRtt < 180 && safeJitter < 30 && safeLoss < 10) {
    return "Variable";
  }

  return "Degraded";
}

function turnLabel(hasTurnConfigured: boolean, relayDetected: boolean) {
  if (!hasTurnConfigured) {
    return "No TURN configured";
  }

  return relayDetected ? "TURN relay active" : "TURN configured";
}

export function VoiceLinkPanel({ enabled, incomingSignal, onSendSignal, onModerateTranscript, onReportQosSample, onLoadQosHistory, onFetchRecommendations, onExportDiagnostics, onCreateShare, onSystemNotice }: VoiceLinkPanelProps) {
  const voice = useWebRtcGroundwork({
    enabled,
    incomingSignal,
    onSendSignal,
    onModerateTranscript,
    onReportQosSample,
    onLoadQosHistory,
    onFetchRecommendations
  });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const noticeKeyRef = useRef("");

  useEffect(() => {
    const preferred = getDiagnosticsExpandedPreference();
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches) {
      setShowDiagnostics(true);
      return;
    }

    setShowDiagnostics(preferred);
  }, []);

  const toggleDiagnostics = () => {
    setShowDiagnostics((current) => {
      const next = !current;
      setDiagnosticsExpandedPreference(next);
      return next;
    });
  };

  useEffect(() => {
    const topAlert = voice.qosAlerts[0]?.message ?? "";
    const topRecommendation = voice.serverRecommendations[0]?.title ?? "";
    const nextKey = `${voice.healthScore}:${topAlert}:${topRecommendation}:${voice.status}`;
    if (!nextKey || nextKey === noticeKeyRef.current) {
      return;
    }

    if (voice.qosAlerts.length > 0 || voice.serverRecommendations.length > 0) {
      onSystemNotice(topAlert || (topRecommendation ? `Voice suggestion: ${topRecommendation}.` : "Voice quality changed."));
      noticeKeyRef.current = nextKey;
    }
  }, [onSystemNotice, voice.healthScore, voice.qosAlerts, voice.serverRecommendations, voice.status]);

  const exportDiagnostics = async () => {
    setExporting(true);
    try {
      const payload = await onExportDiagnostics();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `signal-voice-diagnostics-${payload.sessionId || "session"}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const createShareLink = async () => {
    setSharing(true);
    try {
      const payload = await onCreateShare();
      if (payload.url) {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload.url).catch(() => undefined);
        }
        onSystemNotice("Diagnostics share link copied to clipboard.");
      }
    } finally {
      setSharing(false);
    }
  };

  const actionLabel = voice.status === "connected"
    ? "Refresh voice link"
    : voice.status === "reconnecting"
      ? "Voice recovering..."
      : "Enable live voice";

  const actionDisabled = !enabled || voice.status === "priming" || voice.status === "negotiating";
  const networkQuality = qualityLabel(
    voice.diagnostics.roundTripTimeMs,
    voice.diagnostics.jitterMs,
    voice.diagnostics.packetsLost
  );
  const turnStatus = turnLabel(
    voice.iceConfigSummary.hasTurnConfigured,
    voice.diagnostics.localCandidateType === "relay" || voice.diagnostics.remoteCandidateType === "relay"
  );

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/40">Voice link live</p>
      <h3 className="display-font mt-2 text-lg text-white">Production voice polish.</h3>
      <p className="mt-3 text-sm leading-7 text-white/58">
        {enabled
          ? "Voice now remembers your devices, supports manual recovery, exposes TURN-ready transport health, and offers compact mobile diagnostics."
          : "Enable live mode with server env to test secure signaling and negotiated audio."}
      </p>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/58">
        Status: <span className="text-cyan-100/85">{STATUS_LABELS[voice.status] ?? voice.status}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Health score</div>
          <div className="mt-1 text-lg text-white/88">{voice.healthScore}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Server alerts</div>
          <div className="mt-1 text-white/82">{voice.qosAlerts.length}</div>
        </div>
      </div>

      {voice.qosAlerts.length > 0 ? (
        <div className="mt-4 space-y-2">
          {voice.qosAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.code}
              className={`rounded-2xl border px-3 py-3 text-sm leading-6 ${
                alert.level === "critical"
                  ? "border-red-400/18 bg-red-400/10 text-red-100/90"
                  : "border-orange-300/18 bg-orange-300/10 text-white/76"
              }`}
            >
              <div className="text-[10px] uppercase tracking-[0.22em] opacity-80">{alert.code}</div>
              <div className="mt-1">{alert.message}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-white/56">
          <div className="mb-2 uppercase tracking-[0.22em] text-white/34">Input device</div>
          <select
            value={voice.selectedInputDeviceId}
            onChange={(event) => void voice.selectInputDevice(event.target.value)}
            className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none"
          >
            {voice.inputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-white/56">
          <div className="mb-2 uppercase tracking-[0.22em] text-white/34">Output device</div>
          <select
            value={voice.selectedOutputDeviceId}
            onChange={(event) => void voice.selectOutputDevice(event.target.value)}
            disabled={!voice.outputRoutingSupported || voice.outputDevices.length === 0}
            className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none disabled:opacity-40"
          >
            {voice.outputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-white/56">
          <div className="mb-2 flex items-center justify-between uppercase tracking-[0.22em] text-white/34">
            <span>Mic gain</span>
            <span>{voice.inputGain.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="2"
            step="0.05"
            value={voice.inputGain}
            onChange={(event) => voice.setInputGain(Number(event.target.value))}
            className="w-full accent-cyan-300"
          />
        </label>

        <label className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-white/56">
          <div className="mb-2 flex items-center justify-between uppercase tracking-[0.22em] text-white/34">
            <span>Output volume</span>
            <span>{Math.round(voice.outputVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={voice.outputVolume}
            onChange={(event) => voice.setOutputVolume(Number(event.target.value))}
            className="w-full accent-violet-300"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void voice.testInputDevice()}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.26em] text-white/72 transition hover:border-cyan-300/20 hover:text-cyan-100"
        >
          {voice.testingInput ? "Testing mic..." : "Test mic"}
        </button>
        <button
          type="button"
          onClick={() => void voice.testOutputDevice()}
          disabled={!voice.outputRoutingSupported && voice.outputDevices.length === 0}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.26em] text-white/72 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {voice.testingOutput ? "Testing output..." : "Test speaker"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.18em]">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-white/58">
          You: <span className="text-cyan-100/85">{PRESENCE_LABELS[voice.localPresence] ?? voice.localPresence}</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-white/58">
          Peer: <span className="text-violet-100/85">{PRESENCE_LABELS[voice.remotePresence] ?? voice.remotePresence}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={() => void voice.enableVoice()}
          disabled={actionDisabled}
          className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-xs uppercase tracking-[0.26em] text-cyan-50 transition hover:bg-cyan-300/14 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {actionLabel}
        </button>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void voice.retryVoiceLink()}
            disabled={!enabled || voice.status === "priming"}
            className="rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-xs uppercase tracking-[0.26em] text-violet-50 transition hover:bg-violet-400/14 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Retry voice
          </button>
          <button
            type="button"
            onClick={() => void voice.forceIceRestart()}
            disabled={!enabled || !voice.micReady}
            className="rounded-full border border-orange-300/20 bg-orange-300/10 px-4 py-3 text-xs uppercase tracking-[0.26em] text-orange-50 transition hover:bg-orange-300/14 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Force ICE restart
          </button>
        </div>

        <button
          type="button"
          disabled={!voice.canQueueTransmit}
          onPointerDown={() => void voice.startTransmit()}
          onPointerUp={voice.stopTransmit}
          onPointerLeave={voice.stopTransmit}
          onPointerCancel={voice.stopTransmit}
          className={`rounded-[22px] border px-4 py-4 text-left transition ${
            voice.transmitting
              ? "border-cyan-300/35 bg-cyan-300/10 shadow-glow"
              : voice.queuedTransmit
                ? "border-violet-400/28 bg-violet-400/10 shadow-[0_0_28px_rgba(143,92,255,0.14)]"
                : "border-white/8 bg-white/[0.03] hover:border-cyan-300/20"
          } ${!voice.canQueueTransmit ? "cursor-not-allowed opacity-40" : ""}`}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <div className="display-font text-sm text-white">Hold to Talk</div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
                {voice.transmitting
                  ? "Live transmitting..."
                  : voice.queuedTransmit
                    ? "Queued — will transmit on lock"
                    : "Push-to-talk over the voice channel"}
              </div>
            </div>
            <span className={`h-3 w-3 rounded-full ${voice.transmitting ? "bg-cyan-300 shadow-[0_0_18px_rgba(91,247,255,0.9)]" : voice.queuedTransmit ? "bg-violet-300 shadow-[0_0_18px_rgba(143,92,255,0.8)]" : "bg-white/15"}`} />
          </div>
          <Waveform active={voice.micReady || voice.transmitting || voice.queuedTransmit} level={voice.level} />
        </button>

        <button
          type="button"
          onClick={() => void voice.disableVoice()}
          disabled={!voice.micReady && voice.status !== "connected" && voice.status !== "reconnecting"}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.26em] text-white/72 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Disable voice
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/34">
          <span>Local input activity</span>
          <span>{PRESENCE_LABELS[voice.localPresence] ?? voice.localPresence}</span>
        </div>
        <Waveform active={voice.micReady || voice.transmitting || voice.queuedTransmit} level={voice.level} />
        <div className="mt-3 mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/34">
          <span>Remote activity</span>
          <span>{PRESENCE_LABELS[voice.remotePresence] ?? voice.remotePresence}</span>
        </div>
        <Waveform active={voice.remoteReady} level={voice.remoteLevel} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-white/56">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="uppercase tracking-[0.22em] text-white/34">Network quality</div>
            <div className="mt-1 text-white/82">{networkQuality}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={toggleDiagnostics}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 transition hover:border-cyan-300/20 hover:text-cyan-100"
            >
              {showDiagnostics ? "Hide diagnostics" : "Show diagnostics"}
            </button>
            <button
              type="button"
              onClick={() => void createShareLink()}
              disabled={sharing}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sharing ? "Sharing..." : "Copy share link"}
            </button>
            <button
              type="button"
              onClick={() => void exportDiagnostics()}
              disabled={exporting}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting ? "Exporting..." : "Export JSON"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Permission</div>
          <div className="mt-1 text-white/82">{PERMISSION_LABELS[voice.permissionState] ?? voice.permissionState}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">TURN</div>
          <div className="mt-1 text-white/82">{turnStatus}</div>
        </div>
      </div>

      {!showDiagnostics ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54 sm:hidden">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">RTT</div>
            <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.roundTripTimeMs, " ms")}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Reconnects</div>
            <div className="mt-1 text-white/82">{voice.diagnostics.reconnectAttempts}</div>
          </div>
        </div>
      ) : null}

      {showDiagnostics ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <VoiceHistoryChart
              title="RTT history"
              samples={voice.qosHistory}
              pick={(sample) => sample.roundTripTimeMs}
              unit="ms"
              colorClass="bg-cyan-300"
            />
            <VoiceHistoryChart
              title="Jitter history"
              samples={voice.qosHistory}
              pick={(sample) => sample.jitterMs}
              unit="ms"
              colorClass="bg-violet-300"
            />
            <VoiceHistoryChart
              title="Outbound history"
              samples={voice.qosHistory}
              pick={(sample) => sample.outboundKbps}
              unit="kbps"
              colorClass="bg-orange-300"
            />
            <VoiceHistoryChart
              title="Inbound history"
              samples={voice.qosHistory}
              pick={(sample) => sample.inboundKbps}
              unit="kbps"
              colorClass="bg-green-300"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Network</div>
              <div className="mt-1 text-white/82">{networkQuality}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Reconnects</div>
              <div className="mt-1 text-white/82">{voice.diagnostics.reconnectAttempts}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">RTT</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.roundTripTimeMs, " ms")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Jitter</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.jitterMs, " ms")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Outbound</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.outboundKbps, " kbps")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Inbound</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.inboundKbps, " kbps")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Packets lost</div>
              <div className="mt-1 text-white/82">{voice.diagnostics.packetsLost ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">ICE path</div>
              <div className="mt-1 text-white/82">
                {voice.diagnostics.localCandidateType ?? "—"} → {voice.diagnostics.remoteCandidateType ?? "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/48">
            <div>Connection: <span className="text-white/76">{voice.diagnostics.connectionState}</span></div>
            <div>ICE: <span className="text-white/76">{voice.diagnostics.iceConnectionState}</span></div>
            <div>Signaling: <span className="text-white/76">{voice.diagnostics.signalingState}</span></div>
            <div>ICE config source: <span className="text-white/76">{voice.iceConfigSummary.source}</span></div>
            <div>Configured STUN servers: <span className="text-white/76">{voice.iceConfigSummary.stunCount}</span></div>
            <div>Configured TURN servers: <span className="text-white/76">{voice.iceConfigSummary.turnCount}</span></div>
          </div>
        </>
      ) : null}

      <div className="mt-4 grid gap-2 text-xs text-white/48">
        <div>Mic primed: {voice.micReady ? "yes" : "no"}</div>
        <div>Remote ready: {voice.remoteReady ? "yes" : "no"}</div>
        <div>Browser support: {voice.supported ? "yes" : "no"}</div>
        <div>Output routing: {voice.outputRoutingSupported ? "available" : "browser default only"}</div>
        <div>Speech moderation transcript: {voice.speechSupported ? "available" : "browser fallback only"}</div>
      </div>

      {voice.serverRecommendations.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/58">
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/35">Server recommendations</div>
          <ul className="space-y-2">
            {voice.serverRecommendations.slice(0, 3).map((recommendation) => (
              <li key={recommendation.id}>
                <span className="text-white/82">{recommendation.title}:</span> {recommendation.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <VoiceIncidentTimeline incidents={voice.incidentTimeline} />
      </div>

      {voice.lastTranscript ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/52">
          Last moderated voice transcript: <span className="text-white/72">{voice.lastTranscript}</span>
        </div>
      ) : null}

      {voice.error ? (
        <div className="mt-4 rounded-2xl border border-red-400/18 bg-red-400/10 px-4 py-3 text-xs leading-6 text-red-100/90">
          <div className="uppercase tracking-[0.22em] text-red-100/70">Voice issue</div>
          <div className="mt-2">{voice.error}</div>
          {voice.permissionState === "denied" ? (
            <div className="mt-2 text-red-50/80">Microphone permission is denied. Re-enable it in the browser site settings, then retry the voice link.</div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        <VoiceTroubleshootingWizard
          enabled={enabled}
          supported={voice.supported}
          permissionState={voice.permissionState}
          status={voice.status}
          error={voice.error}
          inputDevicesCount={voice.inputDevices.length}
          outputDevicesCount={voice.outputDevices.length}
          outputRoutingSupported={voice.outputRoutingSupported}
          turnConfigured={voice.iceConfigSummary.hasTurnConfigured}
          turnRelaySatisfied={voice.diagnostics.localCandidateType === "relay" || voice.diagnostics.remoteCandidateType === "relay"}
          networkQuality={networkQuality}
          onEnableVoice={() => void voice.enableVoice()}
          onRetryVoice={() => void voice.retryVoiceLink()}
          onForceIceRestart={() => void voice.forceIceRestart()}
          onTestMic={() => void voice.testInputDevice()}
          onTestSpeaker={() => void voice.testOutputDevice()}
        />
      </div>

      <audio ref={voice.remoteAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}
