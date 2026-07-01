export type ModeOption = "listen" | "talk" | "both";
export type ToneOption = "calm" | "deep" | "funny" | "debate" | "random";
export type FrequencyKind = "daily" | "random" | "channel";
export type AppStage = "landing" | "onboarding" | "frequency" | "intent" | "searching" | "chat" | "receipt" | "lost";
export type SearchPhase = "connecting" | "queued";
export type NetworkEventKind = "blackout" | "collision";
export type WitnessBalance = "giving" | "receiving" | "balanced";
export type ToneAlignment = "aligned" | "drifted" | "unknown";

export interface Frequency {
  id: string;
  number: number;
  prompt: string;
  kind: FrequencyKind;
  dateKey: string;
  channelId?: string;
  channelLabel?: string;
  meshNode?: "plex" | "echo" | "void" | "soft" | "dark";
}

export interface FrequencyPassport {
  dateKey: string;
  frequencyNumber: number;
  kind: FrequencyKind;
  moodTags: string[];
  dominantTone: ToneOption;
  dominantMode: ModeOption;
  avgSessionMinutes: number;
  interferenceLevel: 1 | 2 | 3 | 4 | 5;
  sessionCount: number;
}

export interface SessionReceipt {
  token: string;
  exportedAt: number;
  expiresAt: number;
  durationSeconds: number;
  silenceRatio: number;
  toneAlignment: ToneAlignment;
  protocolBreach: boolean;
  summaryLine: string;
  selfMessages: number;
  peerMessages: number;
  frequencyLabel: string;
  memoryImprint?: MemoryImprint;
}

export interface MemoryImprint {
  imprintStrength: number;
  diffusionRate: number;
  latticeCommitment: string;
  resonanceComposite: number;
  dominantAxis: "depth" | "tempo" | "entropy" | "coherence" | "luminance";
  trajectory: "ascending" | "stable" | "diverging" | "dormant";
  echoMoments: number;
  noovector: [number, number, number];
  prediction: string;
}

export interface DeadDrop {
  id: string;
  body: string;
  createdAt: number;
  expiresAt: number;
  frequencyNumber: number;
  dateKey: string;
  frequencyKind?: FrequencyKind;
  frequencyLabel?: string;
}

export interface WitnessReport {
  selfMessages: number;
  peerMessages: number;
  questionRatio: number;
  longPauseCount: number;
  balance: WitnessBalance;
  insight: string;
}

export interface NetworkEvent {
  kind: NetworkEventKind;
  title: string;
  body: string;
  active: boolean;
  startsAt: number;
  endsAt: number;
  constraints?: {
    modes?: ModeOption[];
    tones?: ToneOption[];
    frequencyKind?: FrequencyKind;
    collisionOverlapMs?: number;
  };
}

export interface TerminalCommandResult {
  handled: boolean;
  suppressSend?: boolean;
  witness?: WitnessReport;
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
