export type SignalSfxKind =
  | "tap"
  | "select"
  | "transition"
  | "connecting"
  | "searching"
  | "matched"
  | "send"
  | "receive"
  | "typing"
  | "lost"
  | "cancel"
  | "warn"
  | "radio-scan"
  | "radio-static"
  | "radio-signal"
  | "radio-beacon";

export const RADIO_SFX_KINDS = [
  "radio-scan",
  "radio-static",
  "radio-signal",
  "radio-beacon"
] as const satisfies readonly SignalSfxKind[];

export function pickRandomRadioSfx() {
  return RADIO_SFX_KINDS[Math.floor(Math.random() * RADIO_SFX_KINDS.length)];
}

type ToneShape = OscillatorType;

interface ToneOptions {
  frequency: number;
  endFrequency?: number;
  type?: ToneShape;
  attack?: number;
  decay?: number;
  peak?: number;
  delay?: number;
  detune?: number;
}

interface NoiseOptions {
  duration?: number;
  filterType?: BiquadFilterType;
  filterFrequency?: number;
  filterQ?: number;
  peak?: number;
  attack?: number;
  decay?: number;
  delay?: number;
}

function getAudioContextCtor() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

function scheduleTone(ctx: AudioContext, output: AudioNode, options: ToneOptions) {
  const {
    frequency,
    endFrequency = frequency,
    type = "sine",
    attack = 0.004,
    decay = 0.12,
    peak = 0.22,
    delay = 0,
    detune = 0
  } = options;

  const start = ctx.currentTime + delay;
  const stop = start + attack + decay + 0.02;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(40, frequency), start);
  if (endFrequency !== frequency) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), start + attack + decay);
  }
  osc.detune.setValueAtTime(detune, start);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);

  osc.connect(gain).connect(output);
  osc.start(start);
  osc.stop(stop);
}

function scheduleNoise(ctx: AudioContext, output: AudioNode, options: NoiseOptions = {}) {
  const {
    duration = 0.08,
    filterType = "bandpass",
    filterFrequency = 1200,
    filterQ = 1.2,
    peak = 0.14,
    attack = 0.002,
    decay = duration,
    delay = 0
  } = options;

  const start = ctx.currentTime + delay;
  const stop = start + attack + decay + 0.02;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * (attack + decay + 0.05))), ctx.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFrequency, start);
  filter.Q.value = filterQ;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);

  source.connect(filter).connect(gain).connect(output);
  source.start(start);
  source.stop(stop);
}

function scheduleRadioScan(ctx: AudioContext, output: AudioNode, peak = 0.09) {
  const start = ctx.currentTime;
  const duration = 0.42;

  scheduleNoise(ctx, output, {
    duration: 0.35,
    filterType: "bandpass",
    filterFrequency: 900,
    filterQ: 1.4,
    peak: peak * 0.7,
    decay: 0.32
  });

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, start);
  osc.frequency.exponentialRampToValueAtTime(2800, start + duration * 0.85);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, start);
  filter.frequency.exponentialRampToValueAtTime(2200, start + duration);
  filter.Q.value = 2.2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(filter).connect(gain).connect(output);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function scheduleRadioChatter(ctx: AudioContext, output: AudioNode, peak = 0.07) {
  const start = ctx.currentTime;
  const duration = 0.28 + Math.random() * 0.35;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * 0.8;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(320 + Math.random() * 180, start);
  filter.frequency.linearRampToValueAtTime(1100 + Math.random() * 600, start + duration * 0.7);
  filter.Q.value = 3.5;

  const tremolo = ctx.createOscillator();
  tremolo.type = "sine";
  tremolo.frequency.value = 14 + Math.random() * 10;
  const tremoloGain = ctx.createGain();
  tremoloGain.gain.value = 0.45;
  tremolo.connect(tremoloGain).connect(filter.frequency);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter).connect(gain).connect(output);
  tremolo.start(start);
  tremolo.stop(start + duration + 0.02);
  source.start(start);
  source.stop(start + duration + 0.02);
}

function scheduleRadioBeacon(ctx: AudioContext, output: AudioNode, peak = 0.08) {
  const dots = [0, 0.14, 0.28];
  dots.forEach((delay, index) => {
    scheduleTone(ctx, output, {
      frequency: 880 - index * 40,
      type: "square",
      attack: 0.001,
      decay: 0.07,
      peak: peak * 0.85,
      delay
    });
  });
  scheduleTone(ctx, output, {
    frequency: 620,
    type: "sine",
    attack: 0.002,
    decay: 0.22,
    peak: peak * 0.7,
    delay: 0.5
  });
  scheduleNoise(ctx, output, {
    duration: 0.06,
    filterType: "highpass",
    filterFrequency: 1600,
    peak: peak * 0.35,
    decay: 0.05,
    delay: 0.48
  });
}

export class SignalSfxEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = false;

  setEnabled(next: boolean) {
    this.enabled = next;
  }

  isEnabled() {
    return this.enabled;
  }

  private async ensureContext() {
    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      return null;
    }

    if (!this.context) {
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    return this.context;
  }

  async prime() {
    await this.ensureContext();
  }

  async play(kind: SignalSfxKind, options?: { gain?: number }) {
    if (!this.enabled) {
      return;
    }

    const ctx = await this.ensureContext();
    if (!ctx || !this.master) {
      return;
    }

    const burst = ctx.createGain();
    burst.gain.value = options?.gain ?? 1;
    burst.connect(this.master);
    const out = burst;

    switch (kind) {
      case "tap":
        scheduleTone(ctx, out, { frequency: 1180, type: "square", attack: 0.002, decay: 0.05, peak: 0.08 });
        scheduleNoise(ctx, out, { duration: 0.02, filterFrequency: 2400, peak: 0.03, decay: 0.02 });
        break;

      case "select":
        scheduleTone(ctx, out, { frequency: 392, type: "triangle", attack: 0.003, decay: 0.08, peak: 0.12 });
        scheduleTone(ctx, out, { frequency: 587, type: "sine", delay: 0.05, attack: 0.003, decay: 0.1, peak: 0.14 });
        scheduleNoise(ctx, out, { duration: 0.03, filterFrequency: 1800, peak: 0.04, decay: 0.03, delay: 0.04 });
        break;

      case "transition":
        scheduleNoise(ctx, out, { duration: 0.06, filterType: "highpass", filterFrequency: 900, peak: 0.05, decay: 0.06 });
        scheduleTone(ctx, out, { frequency: 180, endFrequency: 420, type: "sawtooth", attack: 0.004, decay: 0.14, peak: 0.06 });
        break;

      case "connecting":
        scheduleNoise(ctx, out, { duration: 0.1, filterFrequency: 700, peak: 0.1, decay: 0.1 });
        scheduleTone(ctx, out, { frequency: 220, endFrequency: 940, type: "triangle", attack: 0.01, decay: 0.22, peak: 0.12, delay: 0.04 });
        scheduleTone(ctx, out, { frequency: 1480, type: "square", attack: 0.001, decay: 0.04, peak: 0.04, delay: 0.12 });
        break;

      case "searching":
        scheduleTone(ctx, out, { frequency: 620, endFrequency: 520, type: "sine", attack: 0.002, decay: 0.18, peak: 0.1 });
        scheduleNoise(ctx, out, { duration: 0.04, filterType: "bandpass", filterFrequency: 1600, filterQ: 2.4, peak: 0.05, decay: 0.05 });
        break;

      case "matched":
        scheduleNoise(ctx, out, { duration: 0.14, filterFrequency: 520, filterQ: 0.8, peak: 0.16, decay: 0.12 });
        scheduleTone(ctx, out, { frequency: 311, type: "triangle", attack: 0.004, decay: 0.1, peak: 0.12, delay: 0.08 });
        scheduleTone(ctx, out, { frequency: 415, type: "triangle", attack: 0.004, decay: 0.12, peak: 0.14, delay: 0.14 });
        scheduleTone(ctx, out, { frequency: 523, type: "sine", attack: 0.006, decay: 0.2, peak: 0.16, delay: 0.2 });
        scheduleNoise(ctx, out, { duration: 0.05, filterType: "highpass", filterFrequency: 2200, peak: 0.05, decay: 0.05, delay: 0.18 });
        break;

      case "send":
        scheduleTone(ctx, out, { frequency: 880, endFrequency: 1320, type: "square", attack: 0.002, decay: 0.07, peak: 0.07 });
        scheduleNoise(ctx, out, { duration: 0.025, filterFrequency: 2800, peak: 0.035, decay: 0.025 });
        break;

      case "receive":
        scheduleTone(ctx, out, { frequency: 660, endFrequency: 440, type: "sine", attack: 0.003, decay: 0.12, peak: 0.1 });
        scheduleTone(ctx, out, { frequency: 988, type: "triangle", attack: 0.002, decay: 0.06, peak: 0.05, delay: 0.04 });
        scheduleNoise(ctx, out, { duration: 0.03, filterFrequency: 1400, peak: 0.04, decay: 0.03, delay: 0.02 });
        break;

      case "typing":
        scheduleTone(ctx, out, { frequency: 1040, type: "square", attack: 0.001, decay: 0.03, peak: 0.035 });
        scheduleNoise(ctx, out, { duration: 0.015, filterFrequency: 3000, peak: 0.02, decay: 0.015 });
        break;

      case "lost":
        scheduleNoise(ctx, out, { duration: 0.2, filterType: "lowpass", filterFrequency: 900, peak: 0.14, decay: 0.18 });
        scheduleTone(ctx, out, { frequency: 420, endFrequency: 110, type: "sawtooth", attack: 0.004, decay: 0.35, peak: 0.1 });
        scheduleNoise(ctx, out, { duration: 0.12, filterType: "highpass", filterFrequency: 2000, peak: 0.06, decay: 0.1, delay: 0.12 });
        break;

      case "cancel":
        scheduleTone(ctx, out, { frequency: 360, endFrequency: 180, type: "triangle", attack: 0.003, decay: 0.16, peak: 0.09 });
        scheduleNoise(ctx, out, { duration: 0.08, filterFrequency: 600, peak: 0.07, decay: 0.08, delay: 0.03 });
        break;

      case "warn":
        scheduleTone(ctx, out, { frequency: 220, type: "square", attack: 0.002, decay: 0.08, peak: 0.08 });
        scheduleTone(ctx, out, { frequency: 185, type: "square", attack: 0.002, decay: 0.1, peak: 0.08, delay: 0.1 });
        scheduleNoise(ctx, out, { duration: 0.05, filterFrequency: 1000, peak: 0.05, decay: 0.05, delay: 0.05 });
        break;

      case "radio-scan":
        scheduleRadioScan(ctx, out, 0.1);
        scheduleTone(ctx, out, { frequency: 1200, type: "square", attack: 0.001, decay: 0.03, peak: 0.03, delay: 0.38 });
        break;

      case "radio-static":
        scheduleNoise(ctx, out, { duration: 0.16, filterType: "bandpass", filterFrequency: 1400, filterQ: 0.9, peak: 0.12, decay: 0.14 });
        scheduleNoise(ctx, out, { duration: 0.04, filterType: "highpass", filterFrequency: 2600, peak: 0.05, decay: 0.03, delay: 0.08 });
        scheduleTone(ctx, out, { frequency: 90, type: "sawtooth", attack: 0.002, decay: 0.08, peak: 0.04, delay: 0.1 });
        break;

      case "radio-signal":
        scheduleRadioChatter(ctx, out, 0.075);
        scheduleTone(ctx, out, { frequency: 1540, type: "square", attack: 0.001, decay: 0.025, peak: 0.035, delay: 0.05 });
        scheduleTone(ctx, out, { frequency: 1220, type: "square", attack: 0.001, decay: 0.025, peak: 0.03, delay: 0.18 });
        break;

      case "radio-beacon":
        scheduleRadioBeacon(ctx, out, 0.085);
        break;

      default:
        break;
    }
  }

  dispose() {
    if (this.context) {
      void this.context.close();
    }
    this.context = null;
    this.master = null;
  }
}
