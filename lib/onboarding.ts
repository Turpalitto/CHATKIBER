const ONBOARDING_KEY = "signal-onboarding-seen";

export function hasSeenOnboarding() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingSeen() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ONBOARDING_KEY, "1");
}
