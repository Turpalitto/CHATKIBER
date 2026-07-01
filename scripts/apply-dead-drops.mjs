import fs from "fs";
import path from "path";
import pg from "pg";

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
const connectionString = env.DATABASE_URL;

if (!connectionString) {
  console.error("Set DATABASE_URL in .env.local, e.g.:");
  console.error("DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.dbtksjhuqrgvllvqpthc.supabase.co:5432/postgres");
  process.exit(1);
}

const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/20250630000000_signal_dead_drops.sql"), "utf8");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("signal_dead_drops migration applied successfully.");
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
