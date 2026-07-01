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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const bucket = "signal-dead-drops";
const dateKey = "2025-06-30";
const number = 42;
const drop = {
  body: "probe from verify script",
  createdAt: Date.now(),
  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  frequencyNumber: number,
  dateKey
};

const key = `${dateKey}/${number}.json`;
const { error: uploadError } = await supabase.storage.from(bucket).upload(key, JSON.stringify(drop), {
  contentType: "application/json",
  upsert: true
});

if (uploadError) {
  console.error("upload failed", uploadError.message);
  process.exit(1);
}

const { data, error: downloadError } = await supabase.storage.from(bucket).download(key);
if (downloadError || !data) {
  console.error("download failed", downloadError?.message);
  process.exit(1);
}

console.log("dead drop storage OK", await data.text());

const { error: tableError } = await supabase.from("signal_dead_drops").select("id").limit(1);
console.log("table status", tableError ? tableError.message : "ready");
