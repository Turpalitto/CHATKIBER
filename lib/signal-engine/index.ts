import { Locale } from "@/lib/i18n";
import { Frequency, Message, ModeOption, ModerationResult, ToneOption, VoiceDiagnosticsShareResult, VoiceQosExportResult, VoiceQosRecommendationsResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";
import { createLiveSignalEngine } from "./live-engine";
import { createMockSignalEngine } from "./mock-engine";

export interface EngineConnectOptions {
  anonId: string;
  frequency: Frequency;
  mode: ModeOption;
  tone: ToneOption;
  locale?: Locale;
}

export interface EngineConnectResult {
  status: "matched" | "queued";
  sessionId?: string;
  partnerLabel?: string;
}

export interface EngineSendTextResult {
  ok: boolean;
  text?: string;
  reason?: string;
  moderation?: ModerationResult;
}

export type EngineEvent =
  | { type: "matched"; sessionId: string; partnerLabel: string }
  | { type: "queued" }
  | { type: "typing"; active: boolean }
  | { type: "message"; message: Message }
  | { type: "webrtc-signal"; signal: WebRtcSignalMessage }
  | { type: "disconnected"; reason?: string };

export interface SignalEngine {
  connect(options: EngineConnectOptions): Promise<EngineConnectResult>;
  sendText(text: string): Promise<EngineSendTextResult>;
  sendVoicePulse(level: number): Promise<void>;
  sendWebRtcSignal(signal: WebRtcSignalMessage): Promise<void>;
  moderateVoiceTranscript(transcript: string): Promise<ModerationResult>;
  reportVoiceQos(sample: VoiceQosSample): Promise<VoiceQosReportResult>;
  fetchVoiceQosHistory(): Promise<VoiceQosSample[]>;
  fetchVoiceQosRecommendations(context?: Record<string, unknown>): Promise<VoiceQosRecommendationsResult>;
  exportVoiceDiagnostics(payload?: Record<string, unknown>): Promise<VoiceQosExportResult>;
  createVoiceDiagnosticsShare(): Promise<VoiceDiagnosticsShareResult>;
  disconnect(reason?: string): Promise<void>;
  subscribe(listener: (event: EngineEvent) => void): () => void;
}

export function createSignalEngine() {
  const liveEnabled = process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1";
  if (liveEnabled) {
    return createLiveSignalEngine();
  }

  return createMockSignalEngine();
}
