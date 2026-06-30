"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { formatMessage } from "@/lib/i18n";
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

function formatMetric(value: number | null, suffix: string) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)}${suffix}`;
}

function qualityKey(rtt: number | null, jitter: number | null, loss: number | null) {
  if (rtt === null && jitter === null && loss === null) {
    return "unknown";
  }

  const safeRtt = rtt ?? 999;
  const safeJitter = jitter ?? 999;
  const safeLoss = loss ?? 999;

  if (safeRtt < 90 && safeJitter < 12 && safeLoss < 3) {
    return "stable";
  }

  if (safeRtt < 180 && safeJitter < 30 && safeLoss < 10) {
    return "variable";
  }

  return "degraded";
}

function turnKey(hasTurnConfigured: boolean, relayDetected: boolean) {
  if (!hasTurnConfigured) {
    return "notConfigured";
  }

  return relayDetected ? "relayActive" : "configured";
}

export function VoiceLinkPanel({ enabled, incomingSignal, onSendSignal, onModerateTranscript, onReportQosSample, onLoadQosHistory, onFetchRecommendations, onExportDiagnostics, onCreateShare, onSystemNotice }: VoiceLinkPanelProps) {
  const { m } = useI18n();
  const p = m.voice.panel;
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
      onSystemNotice(
        topAlert ||
          (topRecommendation
            ? formatMessage(m.system.voiceSuggestion, { title: topRecommendation })
            : m.system.voiceQualityChanged)
      );
      noticeKeyRef.current = nextKey;
    }
  }, [m.system.voiceQualityChanged, m.system.voiceSuggestion, onSystemNotice, voice.healthScore, voice.qosAlerts, voice.serverRecommendations, voice.status]);

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
        onSystemNotice(m.system.diagnosticsCopied);
      }
    } finally {
      setSharing(false);
    }
  };

  const actionLabel =
    voice.status === "connected"
      ? p.refreshVoice
      : voice.status === "reconnecting"
        ? p.voiceRecovering
        : p.enableLiveVoice;
  const actionDisabled = !enabled || voice.status === "priming" || voice.status === "negotiating";
  const networkQualityKey = qualityKey(
    voice.diagnostics.roundTripTimeMs,
    voice.diagnostics.jitterMs,
    voice.diagnostics.packetsLost
  );
  const networkQuality = m.voice.quality[networkQualityKey] ?? networkQualityKey;
  const turnStatusKey = turnKey(
    voice.iceConfigSummary.hasTurnConfigured,
    voice.diagnostics.localCandidateType === "relay" || voice.diagnostics.remoteCandidateType === "relay"
  );
  const turnStatus = m.voice.turn[turnStatusKey as keyof typeof m.voice.turn] ?? turnStatusKey;

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/40">{p.eyebrow}</p>
      <h3 className="display-font mt-2 text-lg text-white">{p.title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/58">{enabled ? p.liveEnabled : p.liveDisabled}</p>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/58">
        {p.statusPrefix}{" "}
        <span className="text-cyan-100/85">{m.voice.status[voice.status] ?? voice.status}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.healthScore}</div>
          <div className="mt-1 text-lg text-white/88">{voice.healthScore}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.serverAlerts}</div>
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
          <div className="mb-2 uppercase tracking-[0.22em] text-white/34">{p.inputDevice}</div>
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
          <div className="mb-2 uppercase tracking-[0.22em] text-white/34">{p.outputDevice}</div>
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
            <span>{p.micGain}</span>
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
            <span>{p.outputVolume}</span>
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
          {voice.testingInput ? p.testingMic : p.testMic}
        </button>
        <button
          type="button"
          onClick={() => void voice.testOutputDevice()}
          disabled={!voice.outputRoutingSupported && voice.outputDevices.length === 0}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.26em] text-white/72 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {voice.testingOutput ? p.testingOutput : p.testSpeaker}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.18em]">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-white/58">
          {p.you} <span className="text-cyan-100/85">{m.voice.presence[voice.localPresence] ?? voice.localPresence}</span>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-white/58">
          {p.peer} <span className="text-violet-100/85">{m.voice.presence[voice.remotePresence] ?? voice.remotePresence}</span>
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
            {p.retryVoice}
          </button>
          <button
            type="button"
            onClick={() => void voice.forceIceRestart()}
            disabled={!enabled || !voice.micReady}
            className="rounded-full border border-orange-300/20 bg-orange-300/10 px-4 py-3 text-xs uppercase tracking-[0.26em] text-orange-50 transition hover:bg-orange-300/14 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {p.forceIceRestart}
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
              <div className="display-font text-sm text-white">{p.holdToTalk}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
                {voice.transmitting
                  ? p.liveTransmitting
                  : voice.queuedTransmit
                    ? p.queuedTransmit
                    : p.pttOverChannel}
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
          {p.disableVoice}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/34">
          <span>{p.localActivity}</span>
          <span>{m.voice.presence[voice.localPresence] ?? voice.localPresence}</span>
        </div>
        <Waveform active={voice.micReady || voice.transmitting || voice.queuedTransmit} level={voice.level} />
        <div className="mt-3 mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/34">
          <span>{p.remoteActivity}</span>
          <span>{m.voice.presence[voice.remotePresence] ?? voice.remotePresence}</span>
        </div>
        <Waveform active={voice.remoteReady} level={voice.remoteLevel} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-white/56">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="uppercase tracking-[0.22em] text-white/34">{p.networkQuality}</div>
            <div className="mt-1 text-white/82">{networkQuality}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={toggleDiagnostics}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 transition hover:border-cyan-300/20 hover:text-cyan-100"
            >
              {showDiagnostics ? p.hideDiagnostics : p.showDiagnostics}
            </button>
            <button
              type="button"
              onClick={() => void createShareLink()}
              disabled={sharing}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sharing ? p.sharing : p.copyShareLink}
            </button>
            <button
              type="button"
              onClick={() => void exportDiagnostics()}
              disabled={exporting}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 transition hover:border-cyan-300/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting ? p.exporting : p.exportJson}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.permission}</div>
          <div className="mt-1 text-white/82">{m.voice.permission[voice.permissionState] ?? voice.permissionState}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">TURN</div>
          <div className="mt-1 text-white/82">{turnStatus}</div>
        </div>
      </div>

      {!showDiagnostics ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54 sm:hidden">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.rtt}</div>
            <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.roundTripTimeMs, " ms")}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.reconnects}</div>
            <div className="mt-1 text-white/82">{voice.diagnostics.reconnectAttempts}</div>
          </div>
        </div>
      ) : null}

      {showDiagnostics ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <VoiceHistoryChart
              title={p.rttHistory}
              samples={voice.qosHistory}
              pick={(sample) => sample.roundTripTimeMs}
              unit="ms"
              colorClass="bg-cyan-300"
            />
            <VoiceHistoryChart
              title={p.jitterHistory}
              samples={voice.qosHistory}
              pick={(sample) => sample.jitterMs}
              unit="ms"
              colorClass="bg-violet-300"
            />
            <VoiceHistoryChart
              title={p.outboundHistory}
              samples={voice.qosHistory}
              pick={(sample) => sample.outboundKbps}
              unit="kbps"
              colorClass="bg-orange-300"
            />
            <VoiceHistoryChart
              title={p.inboundHistory}
              samples={voice.qosHistory}
              pick={(sample) => sample.inboundKbps}
              unit="kbps"
              colorClass="bg-green-300"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/54">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.network}</div>
              <div className="mt-1 text-white/82">{networkQuality}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.reconnects}</div>
              <div className="mt-1 text-white/82">{voice.diagnostics.reconnectAttempts}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.rtt}</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.roundTripTimeMs, " ms")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.jitter}</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.jitterMs, " ms")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.outbound}</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.outboundKbps, " kbps")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.inbound}</div>
              <div className="mt-1 text-white/82">{formatMetric(voice.diagnostics.inboundKbps, " kbps")}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.packetsLost}</div>
              <div className="mt-1 text-white/82">{voice.diagnostics.packetsLost ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{p.icePath}</div>
              <div className="mt-1 text-white/82">
                {voice.diagnostics.localCandidateType ?? "—"} → {voice.diagnostics.remoteCandidateType ?? "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/48">
            <div>
              {p.connection}: <span className="text-white/76">{voice.diagnostics.connectionState}</span>
            </div>
            <div>
              {p.ice}: <span className="text-white/76">{voice.diagnostics.iceConnectionState}</span>
            </div>
            <div>
              {p.signaling}: <span className="text-white/76">{voice.diagnostics.signalingState}</span>
            </div>
            <div>
              {p.iceConfigSource}: <span className="text-white/76">{voice.iceConfigSummary.source}</span>
            </div>
            <div>
              {p.stunServers}: <span className="text-white/76">{voice.iceConfigSummary.stunCount}</span>
            </div>
            <div>
              {p.turnServers}: <span className="text-white/76">{voice.iceConfigSummary.turnCount}</span>
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-4 grid gap-2 text-xs text-white/48">
        <div>
          {p.micPrimed}: {voice.micReady ? p.yes : p.no}
        </div>
        <div>
          {p.remoteReady}: {voice.remoteReady ? p.yes : p.no}
        </div>
        <div>
          {p.browserSupport}: {voice.supported ? p.yes : p.no}
        </div>
        <div>
          {p.outputRouting}: {voice.outputRoutingSupported ? p.available : p.browserDefaultOnly}
        </div>
        <div>
          {p.speechModeration}: {voice.speechSupported ? p.available : p.browserFallbackOnly}
        </div>
      </div>

      {voice.serverRecommendations.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/58">
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/35">{p.serverRecommendations}</div>
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
          {p.lastTranscript} <span className="text-white/72">{voice.lastTranscript}</span>
        </div>
      ) : null}

      {voice.error ? (
        <div className="mt-4 rounded-2xl border border-red-400/18 bg-red-400/10 px-4 py-3 text-xs leading-6 text-red-100/90">
          <div className="uppercase tracking-[0.22em] text-red-100/70">{p.voiceIssue}</div>
          <div className="mt-2">{voice.error}</div>
          {voice.permissionState === "denied" ? <div className="mt-2 text-red-50/80">{p.micDenied}</div> : null}
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
          networkQualityKey={networkQualityKey}
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
