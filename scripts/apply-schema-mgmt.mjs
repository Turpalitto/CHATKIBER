import fs from "fs";
import path from "path";

const tokenJson = process.env.SUPABASE_MGMT_TOKEN;
if (!tokenJson) {
  console.error("Set SUPABASE_MGMT_TOKEN");
  process.exit(1);
}

const accessToken = JSON.parse(tokenJson).access_token;
const projectRef = "dbtksjhuqrgvllvqpthc";
const sql = fs.readFileSync(path.join(process.cwd(), "supabase/schema.sql"), "utf8");

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

console.log("Schema applied:", text.slice(0, 500));
