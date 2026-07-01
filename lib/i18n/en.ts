import { Messages } from "./types";

export const en: Messages = {
  meta: {
    title: "SIGNAL",
    description: "Random meaningful anonymous conversations."
  },
  shell: {
    tagline: "Anonymous Conversations",
    online: "online",
    audioOn: "Audio On",
    audioOff: "Audio Off",
    liveBadge: "Live",
    demoBadge: "Demo",
    stepLabel: "Step"
  },
  landing: {
    eyebrow: "Anonymous chat",
    subtitle: "20 minutes of anonymous talk with a stranger",
    pitch: "No name · no profile · one conversation",
    peopleOnline: "people online now",
    quickChannels: "Popular topics",
    rulesLine: "Anonymous · one meeting only · leave anytime",
    comfort: "You don't have to be interesting — honest is enough.",
    safetyShort: "Uncomfortable? Tap End chat — moderation is active.",
    networkBusy: "Lots of people online — match is usually fast",
    networkNormal: "People are online — usually under a minute",
    networkQuiet: "It's quiet now — may take a little longer",
    modeLabel: "How do you want to join?",
    languageNote: "Partner may speak Russian or English",
    channelHint: "Topic",
    searching: "Looking for someone...",
    connect: "Start talking",
    quickConnect: "Just talk",
    customize: "Pick a topic or frequency",
    footer: "One stranger. One real talk. No second meeting."
  },
  onboarding: {
    stepLabel: "Step",
    next: "Next",
    start: "Enter the signal",
    skip: "Skip",
    slides: [
      {
        title: "One signal. One stranger.",
        body: "SIGNAL is not a dating app or social network. Each conversation is temporary, anonymous, and cannot be reopened. Choose a frequency, set your intent, and talk like this is the only time you'll ever meet."
      }
    ]
  },
  frequency: {
    eyebrow: "Choose a channel",
    title: "Tune into tonight's signal.",
    titleShort: "Pick a channel",
    description: "Return for the Frequency of the Day or drift into a random one-time conversation.",
    descriptionShort: "Tap a card — we'll find someone right away.",
    back: "Back",
    dailyTitle: "Join Today's Frequency",
    dailyEyebrow: "Daily ritual",
    randomTitle: "Enter Random Signal",
    randomEyebrow: "Unknown channel",
    dailyRitual: "Daily ritual",
    oneTime: "One-time connection",
    enterSignal: "Enter signal →",
    frequencyLabel: "Frequency",
    randomSignal: "Random Signal",
    channelsTitle: "Thematic channels",
    channelsSubtitle: "Search by topic — construction, cinema, music, and more.",
    channelsSearch: "Search channels: construction, cinema, music…",
    channelsPopular: "Popular",
    channelsAll: "All channels",
    channelsEmpty: "No channels match this search.",
    listeners: "{count} waiting"
  },
  intent: {
    mode: "Mode",
    tone: "Tone",
    back: "Back",
    footer: "No profiles. No likes. No reconnects. One signal, one stranger, one conversation.",
    connect: "Connect",
    presetsTitle: "How do you want to show up?",
    customize: "Customize mode & tone",
    hideCustomize: "Hide options"
  },
  search: {
    eyebrow: "Searching",
    titleConnecting: "Finding someone...",
    titleTuning: "Finding someone...",
    titleQueued: "Still looking...",
    subtitle: "Usually 30–60 seconds. Keep this screen open.",
    subtitleTuning: "Usually under a minute.",
    privacyNote: "No profile is exposed while you wait. Cancel anytime to adjust your intent.",
    hint: "Stay on this screen — we'll connect you automatically.",
    elapsed: "{time}",
    cancel: "Cancel",
    collisionBadge: "Collision window",
    meshTitle: "Channel & node scan",
    meshFooter: "Channel search active: {count} found"
  },
  passport: {
    eyebrow: "Frequency passport",
    title: "Channel #{number} dossier",
    moods: {
      overload: "overload",
      silence: "silence",
      confession: "confession",
      debate: "debate",
      drift: "drift",
      hesitation: "hesitation"
    },
    typicalTone: "Typical tone",
    typicalMode: "Typical mode",
    yourSignal: "Your signal: {mode} · {tone}",
    activity: "{count} sessions in the last 24h",
    avgDuration: "Avg session",
    minutes: "min",
    interference: "Interference"
  },
  tuning: {
    eyebrow: "Resonance lock",
    adjust: "Drag into the cyan band, then hold to lock.",
    aligned: "Aligned — hold to lock the channel.",
    hold: "Hold to lock",
    holding: "Locking...",
    locked: "Channel locked",
    skip: "Skip — search is already running",
    targetBand: "Resonance band"
  },
  receipt: {
    eyebrow: "Session receipt",
    title: "Signal closed.",
    titleShort: "Thanks for the talk",
    duration: "You talked for",
    leaveNote: "Leave a short note for the next person (optional)",
    saving: "Saving...",
    silence: "Silence ratio",
    alignment: "Tone alignment",
    alignments: {
      aligned: "aligned",
      drifted: "drifted",
      unknown: "unknown"
    },
    protocol: "Protocol",
    protocolClear: "clear",
    protocolBreach: "breach logged",
    expires: "Receipt invalid after {time}",
    continue: "Back to home",
    thankYou: "Thanks for the conversation.",
    feedbackQuestion: "How was it?",
    feedbackThanks: "Thanks for your feedback.",
    again: "Talk again",
    summaries: [
      "Operation complete. The channel returns to silence.",
      "You transmitted more than you received.",
      "You received more than you transmitted.",
      "Long silences shaped this session.",
      "Protocol friction was detected."
    ]
  },
  deadDrop: {
    eyebrow: "Dead drop",
    description: "Leave one note for the next stranger on today's frequency. Max 140 chars. Expires in 24h.",
    placeholder: "A note for whoever tunes in next...",
    leave: "Seal drop",
    previous: "Previous signal left:"
  },
  terminal: {
    hint: "Terminal: /drift /pulse /seal /void /witness /resonance /lattice",
    drift: "Drift request transmitted. Suggest tone realignment.",
    pulse: "Pulse sent across the channel.",
    seal: "Topic sealed for this session.",
    void: "Last transmission voided locally.",
    voidEmpty: "No self transmission to void.",
    unknown: "Unknown terminal command.",
    resonance: "Consciousness field mapped. Resonance composite {composite}% · trajectory {trajectory}.",
    lattice: "Lattice unlinkability proof generated. Commitment {commitment} · score {score}%."
  },
  witness: {
    eyebrow: "Witness audit",
    title: "Structural report",
    you: "Your lines",
    peer: "Peer lines",
    questions: "Question ratio",
    pauses: "Long pauses",
    balance: "Flow balance: {value}",
    balances: {
      giving: "you carried the signal",
      receiving: "you received more than you sent",
      balanced: "balanced exchange"
    },
    insights: [
      "The conversation stayed structurally balanced.",
      "You asked most of the questions.",
      "Silence carried significant weight.",
      "You led the transmission load.",
      "You mostly received tonight."
    ],
    close: "Dismiss witness"
  },
  decay: {
    unstable: "Channel instability rising",
    degraded: "Signal degrading",
    critical: "Clearing imminent",
    clearing: "Session clearing in progress — transfer impossible."
  },
  network: {
    blackout: "Blackout protocol active",
    collision: "Collision window open",
    bodies: {
      blackout: "Only listen-mode, calm tone, Daily frequency.",
      collision: "Rare harmonic match — three signals may overlap for 90 seconds."
    }
  },
  lost: {
    eyebrow: "Connection terminated",
    title: "Signal Lost.",
    body: "This conversation will never happen again.",
    findAnother: "Try again"
  },
  moderation: {
    eyebrow: "Moderation notice",
    title: "Keep the signal clean.",
    defaultReason: "This message triggered a safety rule.",
    sentAs: "Sent as:",
    continue: "Continue",
    endSignal: "End signal"
  },
  chat: {
    connected: "connected",
    endSignal: "End chat",
    voiceBurst: "Voice message",
    you: "You",
    system: "System",
    transmitting: "Typing...",
    placeholder: "Write a message...",
    footer: "Voice is optional. Text is enough.",
    send: "Send",
    presenceEyebrow: "About this chat",
    presenceTitle: "One conversation, then it's gone.",
    presenceBody: "No names, no profiles, no way to meet again. When time is up, the chat closes.",
    safetyEyebrow: "Safety",
    safetyBody:
      "Messages are moderated. If something feels wrong, end the chat. Voice uses your mic only if you turn it on.",
    sessionRemaining: "Time left",
    sessionLeft: "{time} left",
    sessionExpired: "Time's up — chat closed.",
    starterEyebrow: "You can start with this",
    starterHint: "Or say anything — there's no wrong opener.",
    safetyShort: "Uncomfortable? End chat anytime.",
    voiceOptional: "Voice is optional — typing is fine.",
    showTools: "Voice & info",
    hideTools: "Hide",
    voiceTitle: "Voice"
  },
  holdToTalk: {
    title: "Hold to Talk",
    transmitting: "Transmitting...",
    pushToTalk: "Push-to-talk",
    micFallback: "Mic fallback active:"
  },
  system: {
    frequencyDaily: "Frequency #{number} • {prompt}",
    frequencyRandom: "Random Signal • {prompt}",
    frequencyChannel: "Channel · {label} · {prompt}",
    waitingForSignal: "Waiting for a compatible signal...",
    noSignalLocked: "No clear signal could be locked.",
    sessionClosed: "Session closed.",
    safetyEnded: "Connection ended by safety system.",
    userEnded: "Conversation ended by user.",
    searchCancelled: "Signal search cancelled.",
    voiceBurstStrong: "Voice burst transmitted.",
    voiceBurstSoft: "Soft transmission sent.",
    voiceQualityChanged: "Voice quality changed.",
    voiceSuggestion: "Voice suggestion: {title}.",
    diagnosticsCopied: "Diagnostics share link copied to clipboard.",
    noActiveSignal: "No active signal.",
    collisionOverlap: "Collision window active — up to three signals may harmonize on this frequency."
  },
  connectionSteps: ["Searching...", "Connecting..."],
  intentPresets: [
    {
      id: "listen",
      label: "Just listen",
      description: "Receive more than you send. Meet someone who wants to speak.",
      mode: "listen",
      tone: "calm"
    },
    {
      id: "talk",
      label: "Just talk",
      description: "You carry the story tonight. Find someone ready to listen.",
      mode: "talk",
      tone: "deep"
    },
    {
      id: "both",
      label: "Balanced chat",
      description: "A two-way conversation with depth and room to breathe.",
      mode: "both",
      tone: "deep"
    }
  ],
  modeOptions: [
    { value: "listen", label: "Mostly listen", description: "Meet someone who wants to talk. You listen more than you speak." },
    { value: "talk", label: "Mostly talk", description: "You lead the conversation. Find someone ready to listen." },
    { value: "both", label: "Back and forth", description: "A normal two-way conversation." }
  ],
  toneOptions: [
    { value: "calm", label: "Calm", description: "Soft presence. No pressure." },
    { value: "deep", label: "Deep", description: "Meaningful, reflective, sincere." },
    { value: "funny", label: "Funny", description: "Light wit. Warm absurdity." },
    { value: "debate", label: "Debate", description: "Sharp thinking. Respectful friction." },
    { value: "random", label: "Random", description: "Whatever the night sends." }
  ],
  partnerLabels: [
    "Unknown Soul",
    "NODE-4821",
    "SIGNAL LINKED",
    "Unknown Mind",
    "NODE-3094",
    "Remote Witness"
  ],
  moderationReasons: {
    sexual: "SIGNAL is not for sexual content or dating-oriented chat.",
    harassment: "Toxic or abusive language breaks the signal.",
    hate: "Hate speech is not allowed on SIGNAL.",
    illegal: "Illegal or extremist content is blocked.",
    contact: "Contact exchange is masked to preserve anonymity.",
    spam: "Please keep the conversation human and readable.",
    contactBlocked: "[contact blocked]",
    numberBlocked: "[number blocked]",
    handleBlocked: "[handle blocked]"
  },
  mock: {
    openingVariants: (prompt) => [
      `I keep thinking about this: ${prompt.toLowerCase()}`,
      `That prompt hit me immediately. ${prompt}`,
      `Maybe we can start here — ${prompt}`,
      `I wasn't expecting that question tonight: ${prompt}`
    ],
    softReplies: [
      "That's more honest than most people would say out loud.",
      "I felt the pause in that. In a good way.",
      "That sounds like something you learned the hard way.",
      "Interesting. What part of that matters most to you now?",
      "I can see why that stayed with you."
    ],
    deepReplies: [
      "Do you think that changed who you are, or only how you move through the world?",
      "Sometimes the decision matters less than the version of us who made it.",
      "That makes me wonder what you had to let go of to become this person.",
      "There's a strange tenderness in the way you said that.",
      "Would your younger self recognize that answer?"
    ],
    debateReplies: [
      "I agree with the feeling, but not necessarily the conclusion.",
      "Maybe the harder question is whether people really change, or only rename their patterns.",
      "I'm not fully convinced. What makes you so sure?"
    ],
    funnyReplies: [
      "That's either wisdom or exhaustion pretending to be wisdom.",
      "Honestly? That sounds suspiciously like character development.",
      "A deeply cinematic answer. I respect it."
    ],
    voiceStrong: "You sounded certain. I heard that.",
    voiceSoft: "That sounded quiet, but present."
  },
  voice: {
    status: {
      disabled: "Live mode unavailable",
      idle: "Voice channel idle",
      priming: "Preparing microphone...",
      negotiating: "Negotiating secure voice link...",
      connected: "Voice channel connected",
      reconnecting: "Reconnecting voice link...",
      ready: "Mic ready — waiting for signal lock",
      error: "Voice link error"
    },
    presence: {
      offline: "Offline",
      idle: "Idle",
      tuning: "Tuning",
      listening: "Listening",
      speaking: "Speaking",
      reconnecting: "Reconnecting"
    },
    permission: {
      unknown: "Unknown",
      prompt: "Prompt",
      granted: "Granted",
      denied: "Denied",
      unsupported: "Unsupported"
    },
    quality: {
      unknown: "Unknown",
      stable: "Stable",
      variable: "Variable",
      degraded: "Degraded"
    },
    turn: {
      notConfigured: "No TURN configured",
      relayActive: "TURN relay active",
      configured: "TURN configured"
    },
    panel: {
      eyebrow: "Voice link live",
      title: "Production voice polish.",
      liveEnabled:
        "Voice now remembers your devices, supports manual recovery, exposes TURN-ready transport health, and offers compact mobile diagnostics.",
      liveDisabled: "Enable live mode with server env to test secure signaling and negotiated audio.",
      statusPrefix: "Status:",
      healthScore: "Health score",
      serverAlerts: "Server alerts",
      inputDevice: "Input device",
      outputDevice: "Output device",
      micGain: "Mic gain",
      outputVolume: "Output volume",
      testingMic: "Testing mic...",
      testMic: "Test mic",
      testingOutput: "Testing output...",
      testSpeaker: "Test speaker",
      you: "You:",
      peer: "Peer:",
      refreshVoice: "Refresh voice link",
      voiceRecovering: "Voice recovering...",
      enableLiveVoice: "Enable live voice",
      retryVoice: "Retry voice",
      forceIceRestart: "Force ICE restart",
      holdToTalk: "Hold to Talk",
      liveTransmitting: "Live transmitting...",
      queuedTransmit: "Queued — will transmit on lock",
      pttOverChannel: "Push-to-talk over the voice channel",
      disableVoice: "Disable voice",
      localActivity: "Local input activity",
      remoteActivity: "Remote activity",
      networkQuality: "Network quality",
      hideDiagnostics: "Hide diagnostics",
      showDiagnostics: "Show diagnostics",
      simpleMode: "Simple",
      advancedMode: "Advanced",
      sharing: "Sharing...",
      copyShareLink: "Copy share link",
      exporting: "Exporting...",
      exportJson: "Export JSON",
      permission: "Permission",
      rtt: "RTT",
      reconnects: "Reconnects",
      network: "Network",
      jitter: "Jitter",
      outbound: "Outbound",
      inbound: "Inbound",
      packetsLost: "Packets lost",
      icePath: "ICE path",
      connection: "Connection",
      ice: "ICE",
      signaling: "Signaling",
      iceConfigSource: "ICE config source",
      stunServers: "Configured STUN servers",
      turnServers: "Configured TURN servers",
      rttHistory: "RTT history",
      jitterHistory: "Jitter history",
      outboundHistory: "Outbound history",
      inboundHistory: "Inbound history",
      micPrimed: "Mic primed",
      remoteReady: "Remote ready",
      browserSupport: "Browser support",
      outputRouting: "Output routing",
      speechModeration: "Speech moderation transcript",
      yes: "yes",
      no: "no",
      available: "available",
      browserDefaultOnly: "browser default only",
      browserFallbackOnly: "browser fallback only",
      serverRecommendations: "Server recommendations",
      lastTranscript: "Last moderated voice transcript:",
      voiceIssue: "Voice issue",
      micDenied: "Microphone permission is denied. Re-enable it in the browser site settings, then retry the voice link."
    },
    incident: {
      title: "Incident timeline",
      empty: "No transport incidents recorded in this session."
    },
    history: {
      noHistory: "No history yet",
      noData: "No data"
    },
    troubleshooting: {
      title: "Troubleshooting guide",
      step: "Step",
      liveUnavailable: {
        title: "Live voice unavailable",
        body: "This browser or deployment does not currently support the full live voice path."
      },
      micDenied: {
        title: "Grant microphone access",
        body: "Microphone permission is denied. Re-enable it in your browser site settings, then retry the voice link."
      },
      micPrompt: {
        title: "Allow microphone access",
        body: "Start the voice link and approve microphone access when the browser asks.",
        action: "Enable voice"
      },
      noMic: {
        title: "Connect a microphone",
        body: "No audio input devices were detected. Plug in a mic or reconnect your headset."
      },
      verifyMic: {
        title: "Verify microphone path",
        body: "Run a quick mic test after switching devices or changing gain.",
        action: "Test mic"
      },
      noSpeaker: {
        title: "Check speaker output",
        body: "No output device choices were detected. Use the browser default output or reconnect speakers."
      },
      verifySpeaker: {
        title: "Verify speaker output",
        body: "Play a quick tone to confirm the selected output path.",
        action: "Test speaker"
      },
      relayInactive: {
        title: "Relay path not active",
        body: "TURN is configured, but the active voice path is not currently using relay. Force an ICE restart if policy or network conditions require relay.",
        action: "Force ICE restart"
      },
      stabilize: {
        title: "Stabilize transport",
        body: "The link is degraded or reconnecting. Retry the voice channel first, then force ICE restart if recovery is slow.",
        action: "Retry voice"
      },
      currentIssue: {
        title: "Current issue",
        action: "Retry voice"
      },
      healthy: {
        title: "Voice path healthy",
        body: "The live voice channel looks stable. If anything sounds wrong, run the mic and speaker tests and check the diagnostics panel."
      }
    }
  },
  future: {
    shell: {
      tagline: "Neural anonymity mesh",
      eraBadge: "2076",
      eraToggleOn: "2076",
      eraToggleOff: "Classic"
    },
    landing: {
      subtitle: "Consciousness-to-consciousness link",
      peopleOnline: "minds in mesh",
      quickConnect: "Initiate neural link",
      customize: "Select quantum channel",
      quickChannels: "Top 10 mesh channels"
    },
    frequency: {
      titleShort: "Quantum channel",
      descriptionShort: "Tap a band or search thematic channels — construction, cinema, music.",
      dailyTitle: "Prime timeline",
      randomTitle: "Drift probability",
      dailyEyebrow: "Anchored day",
      randomEyebrow: "Unstable branch",
      enterSignal: "Entangle →",
      channelsTitle: "Thematic mesh channels",
      channelsSubtitle: "Search by tag — construction, cinema, music, philosophy…",
      channelsSearch: "Search: construction, cinema, music…",
      channelsPopular: "Trending",
      channelsAll: "All mesh channels",
      channelsEmpty: "No mesh channel matches."
    },
    search: {
      titleConnecting: "Neural handshake",
      titleQueued: "Scanning the mesh",
      subtitle: "Predictive synaptic match in progress.",
      collisionBadge: "Temporal overlap",
      predictedEta: "~{seconds}s to link"
    },
    chat: {
      placeholder: "Transmit thought…",
      connected: "entangled"
    },
    receipt: {
      titleShort: "Memory imprint sealed",
      continue: "Release imprint",
      leaveNote: "Leave a trace in the mesh"
    },
    system: {
      frequencyDaily: "Quantum band #{number} · {prompt}",
      frequencyRandom: "Drift channel · {prompt}",
      synapticLink: "Synaptic compatibility {score}% · {prompt}",
      collisionOverlap: "Temporal overlap — two branches converged on the same band."
    },
    network: {
      blackout: "Temporal blackout",
      collision: "Multiverse collision"
    },
    terminal: {
      hint: "Neural terminal: /help · /pulse · /status · /resonance · /lattice",
      resonance: "Consciousness field mapped. Resonance composite {composite}% · trajectory {trajectory}.",
      lattice: "Lattice unlinkability proof generated. Commitment {commitment} · score {score}%."
    },
    connectionSteps: [
      "Calibrating quantum handshake…",
      "Mapping synaptic resonance…",
      "Locking entanglement channel…"
    ],
    consciousness: {
      hudTitle: "Consciousness Resonance Field",
      composite: "Resonance",
      echo: "Temporal echo couplings: {count}",
      latticeTitle: "Lattice Unlinkability Proof",
      unlinkability: "Unlinkability",
      commitment: "Commitment",
      imprintTitle: "Memory Diffusion Index",
      imprintStrength: "Imprint",
      diffusion: "Diffusion",
      dominant: "Dominant axis",
      noovector: "NooVector",
      multiverse: "Branch collapse field",
      echoFlash: "Temporal echo coupling",
      trajectory: {
        ascending: "ascending",
        stable: "stable",
        diverging: "diverging",
        dormant: "dormant"
      },
      axes: {
        depth: "Depth",
        tempo: "Tempo",
        entropy: "Entropy",
        coherence: "Coherence",
        luminance: "Luminance"
      },
      predictions: {
        "noosphere.calibrating": "Noösphere calibrating — insufficient signal density.",
        "noosphere.deepen": "NooVector predicts deepening intimacy over the next arc.",
        "noosphere.catalyst": "Catalyst window — tension and openness may spike.",
        "noosphere.drift": "Semantic drift rising — topic fork probable.",
        "noosphere.fork": "Conversation fork imminent — coherence decay detected.",
        "noosphere.ascend": "Ascending arc — depth and luminance climbing.",
        "noosphere.stable": "Stable orbit — balanced exchange likely to hold."
      }
    }
  }
};
