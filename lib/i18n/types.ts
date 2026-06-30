import { ModeOption, ToneOption } from "@/lib/types";

export type Locale = "en" | "ru";

export interface OptionLabel<T extends string> {
  value: T;
  label: string;
  description: string;
}

export interface Messages {
  meta: {
    title: string;
    description: string;
  };
  shell: {
    tagline: string;
    online: string;
    audioOn: string;
    audioOff: string;
  };
  landing: {
    eyebrow: string;
    subtitle: string;
    peopleOnline: string;
    searching: string;
    connect: string;
    footer: string;
  };
  onboarding: {
    stepLabel: string;
    next: string;
    start: string;
    skip: string;
    slides: Array<{ title: string; body: string }>;
  };
  frequency: {
    eyebrow: string;
    title: string;
    description: string;
    dailyTitle: string;
    dailyEyebrow: string;
    randomTitle: string;
    randomEyebrow: string;
    dailyRitual: string;
    oneTime: string;
    enterSignal: string;
    frequencyLabel: string;
    randomSignal: string;
  };
  intent: {
    mode: string;
    tone: string;
    back: string;
    footer: string;
    connect: string;
  };
  connection: {
    routing: string;
    footer: string;
    stable: string;
    pending: string;
  };
  waiting: {
    eyebrow: string;
    title: string;
    matchNote: string;
    privacyNote: string;
    liveNote: string;
    cancel: string;
  };
  lost: {
    eyebrow: string;
    title: string;
    body: string;
    findAnother: string;
  };
  moderation: {
    eyebrow: string;
    title: string;
    defaultReason: string;
    sentAs: string;
    continue: string;
    endSignal: string;
  };
  chat: {
    connected: string;
    endSignal: string;
    voiceBurst: string;
    you: string;
    system: string;
    transmitting: string;
    placeholder: string;
    footer: string;
    send: string;
    presenceEyebrow: string;
    presenceTitle: string;
    presenceBody: string;
    safetyEyebrow: string;
    safetyBody: string;
    sessionRemaining: string;
    sessionExpired: string;
    showTools: string;
    hideTools: string;
  };
  holdToTalk: {
    title: string;
    transmitting: string;
    pushToTalk: string;
    micFallback: string;
  };
  system: {
    frequencyDaily: string;
    frequencyRandom: string;
    waitingForSignal: string;
    noSignalLocked: string;
    sessionClosed: string;
    safetyEnded: string;
    userEnded: string;
    searchCancelled: string;
    voiceBurstStrong: string;
    voiceBurstSoft: string;
    voiceQualityChanged: string;
    voiceSuggestion: string;
    diagnosticsCopied: string;
    noActiveSignal: string;
  };
  connectionSteps: readonly string[];
  modeOptions: Array<OptionLabel<ModeOption>>;
  toneOptions: Array<OptionLabel<ToneOption>>;
  partnerLabels: readonly string[];
  moderationReasons: {
    sexual: string;
    harassment: string;
    hate: string;
    illegal: string;
    contact: string;
    spam: string;
    contactBlocked: string;
    numberBlocked: string;
    handleBlocked: string;
  };
  mock: {
    openingVariants: (prompt: string) => string[];
    softReplies: string[];
    deepReplies: string[];
    debateReplies: string[];
    funnyReplies: string[];
    voiceStrong: string;
    voiceSoft: string;
  };
  voice: {
    status: Record<string, string>;
    presence: Record<string, string>;
    permission: Record<string, string>;
    quality: Record<string, string>;
    turn: {
      notConfigured: string;
      relayActive: string;
      configured: string;
    };
    panel: {
      eyebrow: string;
      title: string;
      liveEnabled: string;
      liveDisabled: string;
      statusPrefix: string;
      healthScore: string;
      serverAlerts: string;
      inputDevice: string;
      outputDevice: string;
      micGain: string;
      outputVolume: string;
      testingMic: string;
      testMic: string;
      testingOutput: string;
      testSpeaker: string;
      you: string;
      peer: string;
      refreshVoice: string;
      voiceRecovering: string;
      enableLiveVoice: string;
      retryVoice: string;
      forceIceRestart: string;
      holdToTalk: string;
      liveTransmitting: string;
      queuedTransmit: string;
      pttOverChannel: string;
      disableVoice: string;
      localActivity: string;
      remoteActivity: string;
      networkQuality: string;
      hideDiagnostics: string;
      showDiagnostics: string;
      sharing: string;
      copyShareLink: string;
      exporting: string;
      exportJson: string;
      permission: string;
      rtt: string;
      reconnects: string;
      network: string;
      jitter: string;
      outbound: string;
      inbound: string;
      packetsLost: string;
      icePath: string;
      connection: string;
      ice: string;
      signaling: string;
      iceConfigSource: string;
      stunServers: string;
      turnServers: string;
      rttHistory: string;
      jitterHistory: string;
      outboundHistory: string;
      inboundHistory: string;
      micPrimed: string;
      remoteReady: string;
      browserSupport: string;
      outputRouting: string;
      speechModeration: string;
      yes: string;
      no: string;
      available: string;
      browserDefaultOnly: string;
      browserFallbackOnly: string;
      serverRecommendations: string;
      lastTranscript: string;
      voiceIssue: string;
      micDenied: string;
    };
    incident: {
      title: string;
      empty: string;
    };
    history: {
      noHistory: string;
      noData: string;
    };
    troubleshooting: {
      title: string;
      step: string;
      liveUnavailable: { title: string; body: string };
      micDenied: { title: string; body: string };
      micPrompt: { title: string; body: string; action: string };
      noMic: { title: string; body: string };
      verifyMic: { title: string; body: string; action: string };
      noSpeaker: { title: string; body: string };
      verifySpeaker: { title: string; body: string; action: string };
      relayInactive: { title: string; body: string; action: string };
      stabilize: { title: string; body: string; action: string };
      currentIssue: { title: string; action: string };
      healthy: { title: string; body: string };
    };
  };
}
