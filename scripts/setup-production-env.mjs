import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const envPath = path.join(process.cwd(), ".env.local");

const defaults = {
  SIGNAL_STUN_URLS: "stun:stun.relay.metered.ca:80,stun:stun.l.google.com:19302",
  SIGNAL_TURN_URLS:
    "turn:staticauth.openrelay.metered.ca:80,turn:staticauth.openrelay.metered.ca:443,turns:staticauth.openrelay.metered.ca:443?transport=tcp",
  SIGNAL_TURN_SECRET: "openrelayprojectsecret"
};

function loadEnvFile() {
  if (!fs.existsSync(envPath)) {
    return { lines: [], map: {} };
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const map = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      continue;
    }
    map[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return { lines, map };
}

function upsertEnv(key, value) {
  const { lines, map } = loadEnvFile();
  map[key] = value;

  const keys = new Set(Object.keys(map));
  const next = [];
  const seen = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      next.push(line);
      continue;
    }
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      next.push(line);
      continue;
    }
    const k = trimmed.slice(0, idx).trim();
    if (keys.has(k)) {
      next.push(`${k}=${map[k]}`);
      seen.add(k);
    } else {
      next.push(line);
    }
  }

  for (const key of keys) {
    if (!seen.has(key)) {
      next.push(`${key}=${map[key]}`);
    }
  }

  fs.writeFileSync(envPath, `${next.join("\n").trimEnd()}\n`, "utf8");
  return map;
}

const { map: current } = loadEnvFile();
const cronSecret = current.CRON_SECRET?.trim() || crypto.randomBytes(32).toString("hex");

upsertEnv("CRON_SECRET", cronSecret);
for (const [key, value] of Object.entries(defaults)) {
  if (!current[key]?.trim()) {
    upsertEnv(key, value);
  }
}

const pushKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SIGNAL_LIVE",
  "SIGNAL_STUN_URLS",
  "SIGNAL_TURN_URLS",
  "SIGNAL_TURN_SECRET",
  "SIGNAL_TURN_USERNAME",
  "SIGNAL_TURN_CREDENTIAL",
  "SIGNAL_ENFORCE_TURN_RELAY",
  "CRON_SECRET"
];

const env = loadEnvFile().map;
const targets = ["production", "preview", "development"];

for (const key of pushKeys) {
  const value = env[key];
  if (!value) {
    console.log(`skip ${key} (empty)`);
    continue;
  }

  for (const target of targets) {
    const result = spawnSync("npx", ["vercel", "env", "add", key, target, "--force"], {
      input: value,
      encoding: "utf8",
      shell: true,
      cwd: process.cwd()
    });

    if (result.status === 0) {
      console.log(`set ${key} (${target})`);
    } else {
      console.error(`failed ${key} (${target}):`, result.stderr || result.stdout);
    }
  }
}

console.log("\nEnv ready. TURN: Open Relay static auth. CRON_SECRET configured.");
console.log("Redeploy: npx vercel --prod --yes");
