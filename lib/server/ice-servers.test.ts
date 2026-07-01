import { afterEach, describe, expect, it } from "vitest";
import { getServerIceServers, getTurnSummary } from "./ice-servers";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getServerIceServers", () => {
  it("returns default STUN when env is empty", () => {
    delete process.env.SIGNAL_ICE_SERVERS_JSON;
    delete process.env.SIGNAL_STUN_URLS;
    delete process.env.SIGNAL_TURN_URLS;
    const servers = getServerIceServers();
    const urls = Array.isArray(servers[0]?.urls) ? servers[0]?.urls : [servers[0]?.urls];
    expect(urls).toContain("stun:stun.l.google.com:19302");
    expect(urls).toContain("stun:stun1.l.google.com:19302");
  });

  it("builds dynamic TURN credentials when secret is set", () => {
    process.env.SIGNAL_TURN_URLS = "turn:turn.example.com:3478";
    process.env.SIGNAL_TURN_SECRET = "test-secret";
    const servers = getServerIceServers();
    const turn = servers.find((server) => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      return urls.some((url) => url.startsWith("turn:"));
    });
    expect(turn?.username).toMatch(/^\d+:signal$/);
    expect(turn?.credential).toBeTruthy();
    expect(getTurnSummary().dynamicCredentials).toBe(true);
  });
});
