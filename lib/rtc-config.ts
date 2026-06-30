function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface SignalIceConfigSummary {
  source: "json" | "env" | "default";
  hasStunConfigured: boolean;
  hasTurnConfigured: boolean;
  stunCount: number;
  turnCount: number;
}

export function getSignalIceServers(): RTCIceServer[] {
  const fromJson = process.env.NEXT_PUBLIC_SIGNAL_ICE_SERVERS_JSON;
  if (fromJson) {
    try {
      const parsed = JSON.parse(fromJson) as RTCIceServer[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback to env composition below
    }
  }

  const stunUrls = splitList(process.env.NEXT_PUBLIC_SIGNAL_STUN_URLS);
  const turnUrls = splitList(process.env.NEXT_PUBLIC_SIGNAL_TURN_URLS);
  const turnUsername = process.env.NEXT_PUBLIC_SIGNAL_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_SIGNAL_TURN_CREDENTIAL;

  const servers: RTCIceServer[] = [];

  if (stunUrls.length > 0) {
    servers.push({ urls: stunUrls });
  }

  if (turnUrls.length > 0) {
    servers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential
    });
  }

  if (servers.length === 0) {
    return [{ urls: ["stun:stun.l.google.com:19302"] }];
  }

  return servers;
}

export function getSignalIceConfigSummary(): SignalIceConfigSummary {
  const fromJson = process.env.NEXT_PUBLIC_SIGNAL_ICE_SERVERS_JSON;
  if (fromJson) {
    try {
      const parsed = JSON.parse(fromJson) as Array<{ urls?: string | string[] }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        let stunCount = 0;
        let turnCount = 0;
        parsed.forEach((server) => {
          const urls = Array.isArray(server.urls) ? server.urls : server.urls ? [server.urls] : [];
          urls.forEach((url) => {
            if (url.startsWith("turn:")) {
              turnCount += 1;
            } else if (url.startsWith("stun:")) {
              stunCount += 1;
            }
          });
        });

        return {
          source: "json",
          hasStunConfigured: stunCount > 0,
          hasTurnConfigured: turnCount > 0,
          stunCount,
          turnCount
        };
      }
    } catch {
      // fallback to env summary below
    }
  }

  const stunUrls = splitList(process.env.NEXT_PUBLIC_SIGNAL_STUN_URLS);
  const turnUrls = splitList(process.env.NEXT_PUBLIC_SIGNAL_TURN_URLS);

  if (stunUrls.length > 0 || turnUrls.length > 0) {
    return {
      source: "env",
      hasStunConfigured: stunUrls.length > 0,
      hasTurnConfigured: turnUrls.length > 0,
      stunCount: stunUrls.length,
      turnCount: turnUrls.length
    };
  }

  return {
    source: "default",
    hasStunConfigured: true,
    hasTurnConfigured: false,
    stunCount: 1,
    turnCount: 0
  };
}
