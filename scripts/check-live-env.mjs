/**
 * Validates live-mode environment before deploy.
 * Usage: node scripts/check-live-env.mjs
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

const optional = [
  "SIGNAL_TURN_URLS",
  "SIGNAL_TURN_SECRET",
  "SIGNAL_TURN_USERNAME",
  "SIGNAL_TURN_CREDENTIAL"
];

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return {};
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
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    parsed[key] = value;
  }
  return parsed;
}

const env = { ...process.env, ...loadEnvFile() };
const missing = required.filter((key) => !env[key]?.trim());
const live = env.NEXT_PUBLIC_SIGNAL_LIVE === "1";
const turnConfigured = optional.some((key) => Boolean(env[key]?.trim()));

console.log("SIGNAL live env check\n");
console.log(`NEXT_PUBLIC_SIGNAL_LIVE = ${env.NEXT_PUBLIC_SIGNAL_LIVE ?? "(unset)"}`);

if (missing.length > 0) {
  console.log("\nMissing required keys:");
  missing.forEach((key) => console.log(`  - ${key}`));
} else {
  console.log("\nRequired Supabase keys: OK");
}

if (live) {
  console.log("Live mode: enabled");
} else {
  console.log("Live mode: disabled (set NEXT_PUBLIC_SIGNAL_LIVE=1)");
}

if (turnConfigured) {
  console.log("TURN: configured");
} else {
  console.log("TURN: not configured (voice may fail behind strict NAT)");
}

if (missing.length === 0 && live) {
  console.log("\nReady for live matching. Run: npm run dev");
  process.exit(0);
}

console.log("\nFill .env.local from .env.example, then re-run this script.");
process.exit(1);
