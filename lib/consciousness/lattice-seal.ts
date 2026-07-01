import { LatticeSeal } from "@/lib/consciousness/types";

const GRID_DIMENSION = 16;

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fallbackDigest(payload: string) {
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i += 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    bytes[i] = hash & 0xff;
  }
  return bytes;
}

async function digestPayload(payload: string) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
    return new Uint8Array(buffer);
  }
  return fallbackDigest(payload);
}

function computeUnlinkabilityScore(grid: boolean[]) {
  const lit = grid.filter(Boolean).length;
  const target = grid.length / 2;
  const balance = 1 - Math.abs(lit - target) / target;
  const transitions = grid.reduce((sum, cell, index) => {
    if (index === 0) {
      return sum;
    }
    return sum + (cell === grid[index - 1] ? 0 : 1);
  }, 0);
  const entropy = transitions / Math.max(1, grid.length - 1);
  return Math.round(clampScore(balance * 0.62 + entropy * 0.38));
}

function clampScore(value: number) {
  return Math.min(99, Math.max(61, Math.round(value * 100)));
}

export async function createLatticeSeal(payload: string, dimension = GRID_DIMENSION): Promise<LatticeSeal> {
  const digest = await digestPayload(payload);
  const grid: boolean[] = [];

  for (let i = 0; i < dimension * dimension; i += 1) {
    const byte = digest[i % digest.length];
    const mixed = byte ^ digest[(i * 7) % digest.length];
    grid.push(mixed > 127);
  }

  return {
    commitment: bytesToHex(digest).slice(0, 24),
    grid,
    unlinkabilityScore: computeUnlinkabilityScore(grid),
    dimension
  };
}

export function createLatticeSealSync(payload: string, dimension = GRID_DIMENSION): LatticeSeal {
  const digest = fallbackDigest(payload);
  const grid: boolean[] = [];

  for (let i = 0; i < dimension * dimension; i += 1) {
    const byte = digest[i % digest.length];
    const mixed = byte ^ digest[(i * 7) % digest.length];
    grid.push(mixed > 127);
  }

  return {
    commitment: bytesToHex(digest).slice(0, 24),
    grid,
    unlinkabilityScore: computeUnlinkabilityScore(grid),
    dimension
  };
}
