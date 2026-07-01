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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "signal-dead-drops";

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: buckets, error: listError } = await supabase.storage.listBuckets();
if (listError) {
  console.error("Failed to list buckets:", listError.message);
  process.exit(1);
}

const exists = buckets.some((entry) => entry.name === bucket);
if (!exists) {
  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 2048
  });

  if (createError) {
    console.error("Failed to create bucket:", createError.message);
    process.exit(1);
  }

  console.log(`Created storage bucket: ${bucket}`);
} else {
  console.log(`Storage bucket already exists: ${bucket}`);
}

const probeKey = "health-check/probe.json";
const payload = JSON.stringify({ ok: true, at: Date.now() });
const { error: uploadError } = await supabase.storage.from(bucket).upload(probeKey, payload, {
  contentType: "application/json",
  upsert: true
});

if (uploadError) {
  console.error("Failed to upload probe:", uploadError.message);
  process.exit(1);
}

await supabase.storage.from(bucket).remove([probeKey]);
console.log("Storage dead-drop backend ready.");
