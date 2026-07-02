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
    liveBadge: string;
    demoBadge: string;
    stepLabel: string;
  };
  landing: {
    eyebrow: string;
    subtitle: string;
    pitch: string;
    peopleOnline: string;
    quickChannels: string;
    rulesLine: string;
    comfort: string;
    safetyShort: string;
    networkBusy: string;
    networkNormal: string;
    networkQuiet: string;
    modeLabel: string;
    languageNote: string;
    channelHint: string;
    searching: string;
    connect: string;
    quickConnect: string;
    customize: string;
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
    titleShort: string;
    description: string;
    descriptionShort: string;
    back: string;
    dailyTitle: string;
    dailyEyebrow: string;
    randomTitle: string;
    randomEyebrow: string;
    dailyRitual: string;
    oneTime: string;
    enterSignal: string;
    frequencyLabel: string;
    randomSignal: string;
    channelsTitle: string;
    channelsSubtitle: string;
    channelsSearch: string;
    channelsPopular: string;
    channelsAll: string;
    channelsEmpty: string;
    listeners: string;
  };
  intent: {
    mode: string;
    tone: string;
    back: string;
    footer: string;
    connect: string;
    presetsTitle: string;
    customize: string;
    hideCustomize: string;
  };
  search: {
    eyebrow: string;
    titleConnecting: string;
    titleQueued: string;
    titleTuning: string;
    subtitle: string;
    subtitleTuning: string;
    privacyNote: string;
    hint: string;
    elapsed: string;
    cancel: string;
    collisionBadge: string;
    predictedEta?: string;
    meshTitle: string;
    meshFooter: string;
  };
  passport: {
    eyebrow: string;
    title: string;
    moods: Record<string, string>;
    typicalTone: string;
    typicalMode: string;
    yourSignal: string;
    activity: string;
    avgDuration: string;
    minutes: string;
    interference: string;
  };
  tuning: {
    eyebrow: string;
    adjust: string;
    aligned: string;
    hold: string;
    holding: string;
    locked: string;
    skip: string;
    targetBand: string;
  };
  receipt: {
    eyebrow: string;
    title: string;
    titleShort: string;
    duration: string;
    leaveNote: string;
    saving: string;
    silence: string;
    alignment: string;
    alignments: Record<"aligned" | "drifted" | "unknown", string>;
    protocol: string;
    protocolClear: string;
    protocolBreach: string;
    expires: string;
    continue: string;
    thankYou: string;
    feedbackQuestion: string;
    feedbackThanks: string;
    again: string;
    summaries: string[];
  };
  deadDrop: {
    eyebrow: string;
    description: string;
    placeholder: string;
    leave: string;
    previous: string;
  };
  terminal: {
    hint: string;
    drift: string;
    pulse: string;
    seal: string;
    void: string;
    voidEmpty: string;
    unknown: string;
    resonance: string;
    lattice: string;
  };
  witness: {
    eyebrow: string;
    title: string;
    you: string;
    peer: string;
    questions: string;
    pauses: string;
    balance: string;
    balances: Record<"giving" | "receiving" | "balanced", string>;
    insights: string[];
    close: string;
  };
  decay: {
    unstable: string;
    degraded: string;
    critical: string;
    clearing: string;
  };
  network: {
    blackout: string;
    collision: string;
    bodies: {
      blackout: string;
      collision: string;
    };
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
    sessionLeft: string;
    sessionExpired: string;
    starterEyebrow: string;
    starterHint: string;
    safetyShort: string;
    voiceOptional: string;
    showTools: string;
    hideTools: string;
    voiceTitle: string;
    voiceMessageLabel: string;
  };
  experience: {
    reconnect: {
      title: string;
      trying: string;
      retry: string;
      dismiss: string;
      attempt: string;
    };
    history: {
      eyebrow: string;
      title: string;
      empty: string;
      footer: string;
      messages: string;
      open: string;
    };
    echo: {
      eyebrow: string;
      description: string;
      placeholder: string;
      cancel: string;
      send: string;
      sending: string;
      footer: string;
      open: string;
    };
    matchQuality: {
      title: string;
    };
    deadDropPanel: {
      title: string;
      leave: string;
      placeholder: string;
      submit: string;
      submitting: string;
      empty: string;
      expires: string;
    };
    pwa: {
      title: string;
      body: string;
      install: string;
      dismiss: string;
    };
    channels: {
      top: string;
      create: string;
    };
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
    frequencyChannel: string;
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
    collisionOverlap: string;
    synapticLink?: string;
  };
  connectionSteps: readonly string[];
  intentPresets: Array<{
    id: string;
    label: string;
    description: string;
    mode: ModeOption;
    tone: ToneOption;
  }>;
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
      simpleMode: string;
      advancedMode: string;
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
  future: {
    shell: {
      tagline: string;
      eraBadge: string;
      eraToggleOn: string;
      eraToggleOff: string;
    };
    landing: {
      subtitle: string;
      peopleOnline: string;
      quickConnect: string;
      customize: string;
      quickChannels?: string;
      pitch?: string;
      rulesLine?: string;
      modeLabel?: string;
      comfort?: string;
      safetyShort?: string;
      footer?: string;
    };
    frequency: {
      titleShort: string;
      descriptionShort: string;
      dailyTitle: string;
      randomTitle: string;
      dailyEyebrow: string;
      randomEyebrow: string;
      enterSignal: string;
      channelsTitle?: string;
      channelsSubtitle?: string;
      channelsSearch?: string;
      channelsPopular?: string;
      channelsAll?: string;
      channelsEmpty?: string;
    };
    search: {
      titleConnecting: string;
      titleQueued: string;
      subtitle: string;
      collisionBadge: string;
      predictedEta: string;
    };
    chat: {
      placeholder: string;
      connected: string;
    };
    receipt: {
      titleShort: string;
      continue: string;
      leaveNote: string;
    };
    system: {
      frequencyDaily: string;
      frequencyRandom: string;
      synapticLink: string;
      collisionOverlap: string;
    };
    network: {
      blackout: string;
      collision: string;
    };
    terminal: {
      hint: string;
      resonance: string;
      lattice: string;
    };
    connectionSteps: readonly string[];
    consciousness: {
      hudTitle: string;
      composite: string;
      echo: string;
      latticeTitle: string;
      unlinkability: string;
      commitment: string;
      imprintTitle: string;
      imprintStrength: string;
      diffusion: string;
      dominant: string;
      noovector: string;
      multiverse: string;
      echoFlash: string;
      trajectory: {
        ascending: string;
        stable: string;
        diverging: string;
        dormant: string;
      };
      axes: {
        depth: string;
        tempo: string;
        entropy: string;
        coherence: string;
        luminance: string;
      };
      predictions: {
        "noosphere.calibrating": string;
        "noosphere.deepen": string;
        "noosphere.catalyst": string;
        "noosphere.drift": string;
        "noosphere.fork": string;
        "noosphere.ascend": string;
        "noosphere.stable": string;
      };
    };
  };
}
