import fs from "fs";
import path from "path";

const tokenJson = process.env.SUPABASE_MGMT_TOKEN;
if (!tokenJson) {
  console.error("Set SUPABASE_MGMT_TOKEN");
  process.exit(1);
}

const parsed = JSON.parse(tokenJson);
let accessToken = parsed.access_token;

if (!accessToken || parsed.expires_at < Date.now() / 1000) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: parsed.refresh_token
  });

  const refreshResponse = await fetch("https://api.supabase.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const refreshText = await refreshResponse.text();
  if (!refreshResponse.ok) {
    console.error("Token refresh failed", refreshResponse.status, refreshText);
    process.exit(1);
  }

  const refreshed = JSON.parse(refreshText);
  accessToken = refreshed.access_token;
}

const projectRef = "dbtksjhuqrgvllvqpthc";
const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/20250630000000_signal_dead_drops.sql"), "utf8");

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query: sql })
});

const text = await response.text();
if (!response.ok) {
  console.error("Query failed", response.status, text);
  process.exit(1);
}

console.log("signal_dead_drops migration applied:", text.slice(0, 500));
