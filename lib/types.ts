export type ModeOption = "listen" | "talk" | "both";
export type ToneOption = "calm" | "deep" | "funny" | "debate" | "random";
export type FrequencyKind = "daily" | "random";
export type AppStage = "landing" | "onboarding" | "frequency" | "intent" | "connecting" | "waiting" | "chat" | "lost";

export interface Frequency {
  id: string;
  number: number;
  prompt: string;
  kind: FrequencyKind;
  dateKey: string;
}

export interface Message {
  id: string;
  sender: "self" | "peer" | "system";
  type: "text" | "system" | "voice";
  text: string;
  createdAt: number;
}

export interface ModerationResult {
  status: "allow" | "warn" | "block";
  category?: "sexual" | "harassment" | "contact" | "hate" | "illegal" | "spam" | "policy";
  reason?: string;
  maskedText?: string;
}

export interface VoiceQosSample {
  createdAt: number;
  connectionState: string;
  iceConnectionState: string;
  signalingState: string;
  roundTripTimeMs: number | null;
  outboundKbps: number | null;
  inboundKbps: number | null;
  packetsLost: number | null;
  jitterMs: number | null;
  localCandidateType: string | null;
  remoteCandidateType: string | null;
}

export interface VoiceQosAlert {
  level: "info" | "warn" | "critical";
  code: string;
  message: string;
}

export interface VoiceTroubleshootingRecommendation {
  id: string;
  title: string;
  description: string;
  action?: "enable-voice" | "retry-voice" | "force-ice-restart" | "test-mic" | "test-speaker" | "grant-mic-permission" | "configure-turn" | "check-network";
}

export interface VoiceIncidentEvent {
  createdAt: number;
  level: "info" | "warn" | "critical";
  title: string;
  details: string;
}

export interface VoiceQosReportResult {
  status: "ok" | "warn" | "blocked";
  reason?: string;
  history: VoiceQosSample[];
  turnRelaySatisfied: boolean;
  turnRelayRequired: boolean;
  healthScore: number;
  alerts: VoiceQosAlert[];
  recommendations: VoiceTroubleshootingRecommendation[];
  incidents: VoiceIncidentEvent[];
}

export interface VoiceQosRecommendationsResult {
  healthScore: number;
  alerts: VoiceQosAlert[];
  recommendations: VoiceTroubleshootingRecommendation[];
  turnRelaySatisfied: boolean;
  turnRelayRequired: boolean;
  latestSample: VoiceQosSample | null;
  incidents: VoiceIncidentEvent[];
}

export interface VoiceQosExportResult {
  sessionId: string;
  exportedAt: number;
  healthScore: number;
  alerts: VoiceQosAlert[];
  recommendations: VoiceTroubleshootingRecommendation[];
  turnRelaySatisfied: boolean;
  turnRelayRequired: boolean;
  incidents: VoiceIncidentEvent[];
  history: VoiceQosSample[];
}

export interface VoiceDiagnosticsShareResult {
  token: string;
  url: string;
  expiresAt: number;
}

export interface VoiceQosAdminSessionSummary {
  sessionId: string;
  sampleCount: number;
  latestAt: number;
  healthScore: number;
  alerts: VoiceQosAlert[];
  turnRelayRequired: boolean;
  turnRelaySatisfied: boolean;
}

export interface VoiceQosAdminDashboardResult {
  generatedAt: number;
  sessionCount: number;
  sessions: VoiceQosAdminSessionSummary[];
}

export type WebRtcSignalType = "request-offer" | "offer" | "answer" | "ice" | "hangup";

export interface WebRtcSignalMessage {
  id: string;
  type: WebRtcSignalType;
  senderTag?: string;
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  createdAt: number;
}
