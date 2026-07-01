import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const keys = [
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

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found");
    process.exit(1);
  }

  const parsed = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      continue;
    }
    parsed[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return parsed;
}

const env = loadEnvFile();
const targets = ["production", "preview", "development"];

for (const key of keys) {
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

console.log("\nDone. Redeploy: npx vercel --prod --yes");
