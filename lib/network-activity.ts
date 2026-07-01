export type NetworkActivity = "busy" | "normal" | "quiet";

export function getNetworkActivity(onlineCount: number): NetworkActivity {
  if (onlineCount >= 18_000) {
    return "busy";
  }
  if (onlineCount >= 8_000) {
    return "normal";
  }
  return "quiet";
}
