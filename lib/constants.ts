import { ModeOption, ToneOption } from "./types";

export const CONNECTION_STEPS = [
  "Initializing...",
  "Searching nearby minds...",
  "Tuning frequency...",
  "Connecting...",
  "Signal locked."
] as const;

export const MODE_OPTIONS: Array<{ value: ModeOption; label: string; description: string }> = [
  { value: "listen", label: "Just Listen", description: "Meet someone who wants to speak. Receive more than you send." },
  { value: "talk", label: "Just Talk", description: "You carry the story tonight. Find someone ready to listen." },
  { value: "both", label: "Both", description: "A balanced two-way conversation." }
];

export const TONE_OPTIONS: Array<{ value: ToneOption; label: string; description: string }> = [
  { value: "calm", label: "Calm", description: "Soft presence. No pressure." },
  { value: "deep", label: "Deep", description: "Meaningful, reflective, sincere." },
  { value: "funny", label: "Funny", description: "Light wit. Warm absurdity." },
  { value: "debate", label: "Debate", description: "Sharp thinking. Respectful friction." },
  { value: "random", label: "Random", description: "Whatever the night sends." }
];

export const PARTNER_LABELS = [
  "Unknown Soul",
  "NODE-4821",
  "SIGNAL LINKED",
  "Unknown Mind",
  "NODE-3094",
  "Remote Witness"
];
