"use client";

import { useI18n } from "@/components/locale-provider";

interface VoiceTroubleshootingWizardProps {
  enabled: boolean;
  supported: boolean;
  permissionState: string;
  status: string;
  error: string | null;
  inputDevicesCount: number;
  outputDevicesCount: number;
  outputRoutingSupported: boolean;
  turnConfigured: boolean;
  turnRelaySatisfied: boolean;
  networkQualityKey: string;
  onEnableVoice: () => void;
  onRetryVoice: () => void;
  onForceIceRestart: () => void;
  onTestMic: () => void;
  onTestSpeaker: () => void;
}

export function VoiceTroubleshootingWizard({
  enabled,
  supported,
  permissionState,
  status,
  error,
  inputDevicesCount,
  outputDevicesCount,
  outputRoutingSupported,
  turnConfigured,
  turnRelaySatisfied,
  networkQualityKey,
  onEnableVoice,
  onRetryVoice,
  onForceIceRestart,
  onTestMic,
  onTestSpeaker
}: VoiceTroubleshootingWizardProps) {
  const { m } = useI18n();
  const t = m.voice.troubleshooting;
  const steps: Array<{ title: string; body: string; actionLabel?: string; onAction?: () => void; tone?: "normal" | "warn" | "error" }> = [];

  if (!enabled || !supported) {
    steps.push({ ...t.liveUnavailable, tone: "warn" });
  }

  if (permissionState === "denied") {
    steps.push({ ...t.micDenied, tone: "error" });
  } else if (permissionState === "prompt" || permissionState === "unknown") {
    steps.push({ ...t.micPrompt, actionLabel: t.micPrompt.action, onAction: onEnableVoice, tone: "warn" });
  }

  if (inputDevicesCount === 0) {
    steps.push({ ...t.noMic, tone: "error" });
  } else {
    steps.push({ ...t.verifyMic, actionLabel: t.verifyMic.action, onAction: onTestMic });
  }

  if (outputDevicesCount === 0 && outputRoutingSupported) {
    steps.push({ ...t.noSpeaker, tone: "warn" });
  } else {
    steps.push({ ...t.verifySpeaker, actionLabel: t.verifySpeaker.action, onAction: onTestSpeaker });
  }

  if (turnConfigured && !turnRelaySatisfied && status === "connected") {
    steps.push({ ...t.relayInactive, actionLabel: t.relayInactive.action, onAction: onForceIceRestart, tone: "warn" });
  }

  if (status === "reconnecting" || networkQualityKey === "degraded") {
    steps.push({ ...t.stabilize, actionLabel: t.stabilize.action, onAction: onRetryVoice, tone: "warn" });
  }

  if (error) {
    steps.push({ title: t.currentIssue.title, body: error, actionLabel: t.currentIssue.action, onAction: onRetryVoice, tone: "error" });
  }

  if (steps.length === 0) {
    steps.push(t.healthy);
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-cyan-100/38">{t.title}</div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={`${step.title}-${index}`}
            className={`rounded-2xl border px-4 py-3 ${
              step.tone === "error"
                ? "border-red-400/18 bg-red-400/8"
                : step.tone === "warn"
                  ? "border-orange-300/18 bg-orange-300/8"
                  : "border-white/8 bg-white/[0.02]"
            }`}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-white/74">
              {t.step} {index + 1}
            </div>
            <div className="mt-1 text-sm text-white">{step.title}</div>
            <div className="mt-2 text-sm leading-6 text-white/58">{step.body}</div>
            {step.actionLabel && step.onAction ? (
              <button
                type="button"
                onClick={step.onAction}
                className="mt-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/76 transition hover:border-cyan-300/20 hover:text-cyan-100"
              >
                {step.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
