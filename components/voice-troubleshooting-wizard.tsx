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
  networkQuality: string;
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
  networkQuality,
  onEnableVoice,
  onRetryVoice,
  onForceIceRestart,
  onTestMic,
  onTestSpeaker
}: VoiceTroubleshootingWizardProps) {
  const steps: Array<{ title: string; body: string; actionLabel?: string; onAction?: () => void; tone?: "normal" | "warn" | "error" }> = [];

  if (!enabled || !supported) {
    steps.push({
      title: "Live voice unavailable",
      body: "This browser or deployment does not currently support the full live voice path.",
      tone: "warn"
    });
  }

  if (permissionState === "denied") {
    steps.push({
      title: "Grant microphone access",
      body: "Microphone permission is denied. Re-enable it in your browser site settings, then retry the voice link.",
      tone: "error"
    });
  } else if (permissionState === "prompt" || permissionState === "unknown") {
    steps.push({
      title: "Allow microphone access",
      body: "Start the voice link and approve microphone access when the browser asks.",
      actionLabel: "Enable voice",
      onAction: onEnableVoice,
      tone: "warn"
    });
  }

  if (inputDevicesCount === 0) {
    steps.push({
      title: "Connect a microphone",
      body: "No audio input devices were detected. Plug in a mic or reconnect your headset.",
      tone: "error"
    });
  } else {
    steps.push({
      title: "Verify microphone path",
      body: "Run a quick mic test after switching devices or changing gain.",
      actionLabel: "Test mic",
      onAction: onTestMic
    });
  }

  if (outputDevicesCount === 0 && outputRoutingSupported) {
    steps.push({
      title: "Check speaker output",
      body: "No output device choices were detected. Use the browser default output or reconnect speakers.",
      tone: "warn"
    });
  } else {
    steps.push({
      title: "Verify speaker output",
      body: "Play a quick tone to confirm the selected output path.",
      actionLabel: "Test speaker",
      onAction: onTestSpeaker
    });
  }

  if (turnConfigured && !turnRelaySatisfied && status === "connected") {
    steps.push({
      title: "Relay path not active",
      body: "TURN is configured, but the active voice path is not currently using relay. Force an ICE restart if policy or network conditions require relay.",
      actionLabel: "Force ICE restart",
      onAction: onForceIceRestart,
      tone: "warn"
    });
  }

  if (status === "reconnecting" || networkQuality === "Degraded") {
    steps.push({
      title: "Stabilize transport",
      body: "The link is degraded or reconnecting. Retry the voice channel first, then force ICE restart if recovery is slow.",
      actionLabel: "Retry voice",
      onAction: onRetryVoice,
      tone: "warn"
    });
  }

  if (error) {
    steps.push({
      title: "Current issue",
      body: error,
      actionLabel: "Retry voice",
      onAction: onRetryVoice,
      tone: "error"
    });
  }

  if (steps.length === 0) {
    steps.push({
      title: "Voice path healthy",
      body: "The live voice channel looks stable. If anything sounds wrong, run the mic and speaker tests and check the diagnostics panel."
    });
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-cyan-100/38">Troubleshooting guide</div>
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
            <div className="text-xs uppercase tracking-[0.2em] text-white/74">Step {index + 1}</div>
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
