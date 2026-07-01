import { createHmac } from "crypto";

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

function buildTurnCredential(ttlSeconds: number) {
  const secret = process.env.SIGNAL_TURN_SECRET;
  if (!secret) {
    return null;
  }

  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  const username = `${expiry}:signal`;
  const credential = createHmac("sha1", secret).update(username).digest("base64");
  return { username, credential };
}

export function getServerIceServers() {
  const fromJson = process.env.SIGNAL_ICE_SERVERS_JSON ?? process.env.NEXT_PUBLIC_SIGNAL_ICE_SERVERS_JSON;
  if (fromJson) {
    try {
      const parsed = JSON.parse(fromJson) as IceServerConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fall through
    }
  }

  const servers: IceServerConfig[] = [];
  const stunUrls = splitList(process.env.SIGNAL_STUN_URLS ?? process.env.NEXT_PUBLIC_SIGNAL_STUN_URLS);
  const turnUrls = splitList(process.env.SIGNAL_TURN_URLS ?? process.env.NEXT_PUBLIC_SIGNAL_TURN_URLS);

  if (stunUrls.length > 0) {
    servers.push({ urls: stunUrls });
  }

  if (turnUrls.length > 0) {
    const dynamic = buildTurnCredential(86_400);
    servers.push({
      urls: turnUrls,
      username: dynamic?.username ?? process.env.SIGNAL_TURN_USERNAME ?? process.env.NEXT_PUBLIC_SIGNAL_TURN_USERNAME,
      credential: dynamic?.credential ?? process.env.SIGNAL_TURN_CREDENTIAL ?? process.env.NEXT_PUBLIC_SIGNAL_TURN_CREDENTIAL
    });
  }

  if (servers.length === 0) {
    return [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }
    ];
  }

  if (turnUrls.length === 0 && stunUrls.length === 1) {
    servers[0] = { urls: [stunUrls[0], "stun:stun1.l.google.com:19302"] };
  }

  return servers;
}

export function getTurnSummary() {
  const servers = getServerIceServers();
  let stunCount = 0;
  let turnCount = 0;

  servers.forEach((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    urls.forEach((url) => {
      if (url.startsWith("turn:") || url.startsWith("turns:")) {
        turnCount += 1;
      } else if (url.startsWith("stun:")) {
        stunCount += 1;
      }
    });
  });

  return {
    hasTurnConfigured: turnCount > 0,
    hasStunConfigured: stunCount > 0,
    stunCount,
    turnCount,
    dynamicCredentials: Boolean(process.env.SIGNAL_TURN_SECRET)
  };
}
