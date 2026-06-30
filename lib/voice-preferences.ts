const INPUT_KEY = "signal.voice.inputDeviceId";
const OUTPUT_KEY = "signal.voice.outputDeviceId";
const DIAGNOSTICS_KEY = "signal.voice.diagnosticsExpanded";
const INPUT_GAIN_KEY = "signal.voice.inputGain";
const OUTPUT_VOLUME_KEY = "signal.voice.outputVolume";

function read(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!value) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, value);
  } catch {
    // ignore persistence failures
  }
}

export function getPreferredInputDeviceId() {
  return read(INPUT_KEY);
}

export function setPreferredInputDeviceId(value: string) {
  write(INPUT_KEY, value);
}

export function getPreferredOutputDeviceId() {
  return read(OUTPUT_KEY);
}

export function setPreferredOutputDeviceId(value: string) {
  write(OUTPUT_KEY, value);
}

export function getDiagnosticsExpandedPreference() {
  const raw = read(DIAGNOSTICS_KEY);
  return raw === "1";
}

export function setDiagnosticsExpandedPreference(value: boolean) {
  write(DIAGNOSTICS_KEY, value ? "1" : "0");
}

export function getPreferredInputGain() {
  const raw = read(INPUT_GAIN_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.1;
}

export function setPreferredInputGain(value: number) {
  write(INPUT_GAIN_KEY, String(value));
}

export function getPreferredOutputVolume() {
  const raw = read(OUTPUT_VOLUME_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}

export function setPreferredOutputVolume(value: number) {
  write(OUTPUT_VOLUME_KEY, String(value));
}
