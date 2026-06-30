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
    audioOff: "Audio Off"
  },
  landing: {
    eyebrow: "Unknown frequency detected",
    subtitle: "Anonymous Conversations",
    peopleOnline: "people online",
    searching: "Searching frequency...",
    connect: "Connect",
    footer: "One stranger. One real conversation. No profiles, no likes, no second meeting."
  },
  onboarding: {
    stepLabel: "Step",
    next: "Next",
    start: "Enter the signal",
    skip: "Skip",
    slides: [
      {
        title: "One signal. One stranger.",
        body: "SIGNAL is not a dating app or social network. Each conversation is temporary and cannot be reopened."
      },
      {
        title: "Stay anonymous.",
        body: "No profiles, no likes, no contact exchange. Moderation filters toxic, sexual, and contact-seeking content."
      },
      {
        title: "Make it real.",
        body: "Choose a frequency, set your intent, and talk like this is the only time you'll ever meet."
      }
    ]
  },
  frequency: {
    eyebrow: "Choose a channel",
    title: "Tune into tonight's signal.",
    description: "Return for the Frequency of the Day or drift into a random one-time conversation.",
    dailyTitle: "Join Today's Frequency",
    dailyEyebrow: "Daily ritual",
    randomTitle: "Enter Random Signal",
    randomEyebrow: "Unknown channel",
    dailyRitual: "Daily ritual",
    oneTime: "One-time connection",
    enterSignal: "Enter signal →",
    frequencyLabel: "Frequency",
    randomSignal: "Random Signal"
  },
  intent: {
    mode: "Mode",
    tone: "Tone",
    back: "Back",
    footer: "No profiles. No likes. No reconnects. One signal, one stranger, one conversation.",
    connect: "Connect"
  },
  connection: {
    routing: "Signal routing",
    footer: "No profiles are exposed. The conversation channel is temporary and cannot be reopened after it ends.",
    stable: "stable",
    pending: "pending"
  },
  waiting: {
    eyebrow: "Queued signal",
    title: "Searching for a compatible mind...",
    matchNote: "Matching respects frequency, tone, and conversation intent.",
    privacyNote: "No profile is exposed while you wait. If no compatible signal appears, you can cancel and retune.",
    liveNote: "Waiting is real in live mode. To test with two tabs, use incognito or another browser.",
    sameBrowserHint: "Each tab is now a separate signal. Pick the same frequency (Daily works best) and matching tone/mode.",
    cancel: "Cancel search"
  },
  lost: {
    eyebrow: "Connection terminated",
    title: "Signal Lost.",
    body: "This conversation will never happen again.",
    findAnother: "Find another signal"
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
    connected: "CONNECTED",
    endSignal: "End signal",
    voiceBurst: "Voice burst",
    you: "You",
    system: "System",
    transmitting: "Transmitting...",
    placeholder: "Transmit something real...",
    footer: "No contact exchange. No profiles. No second meeting.",
    send: "Send",
    presenceEyebrow: "Presence",
    presenceTitle: "One real conversation.",
    presenceBody: "When this ends, the signal closes permanently. Stay here. Stay anonymous.",
    safetyEyebrow: "Safety",
    safetyBody:
      "Live mode now routes text and voice signaling through a server-side relay, with transcript-based moderation for voice when the browser supports speech recognition.",
    sessionRemaining: "Time left",
    sessionExpired: "Session time ended.",
    showTools: "Show tools",
    hideTools: "Hide tools"
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
    noActiveSignal: "No active signal."
  },
  connectionSteps: [
    "Initializing...",
    "Searching nearby minds...",
    "Tuning frequency...",
    "Connecting...",
    "Signal locked."
  ],
  modeOptions: [
    { value: "listen", label: "Just Listen", description: "Meet someone who wants to speak. Receive more than you send." },
    { value: "talk", label: "Just Talk", description: "You carry the story tonight. Find someone ready to listen." },
    { value: "both", label: "Both", description: "A balanced two-way conversation." }
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
  }
};
