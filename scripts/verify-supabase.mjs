import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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
    parsed[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return parsed;
}

const env = { ...process.env, ...loadEnvFile() };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data, error } = await supabase.rpc("join_signal_queue", {
  p_anon_token_hash: "health-check-" + Date.now(),
  p_mode: "both",
  p_tone: "random",
  p_frequency_kind: "daily",
  p_frequency_number: 1,
  p_frequency_prompt: "health"
});

if (error?.message?.includes("Could not find the function")) {
  console.error("Schema not applied yet:", error.message);
  process.exit(2);
}

if (error) {
  console.error("Supabase error:", error.message);
  process.exit(1);
}

console.log("Supabase live OK", data);
const hash = "health-check-" + Date.now();
await supabase.rpc("leave_signal_queue", { p_anon_token_hash: hash });
process.exit(0);
