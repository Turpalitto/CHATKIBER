import fs from "fs";
import path from "path";

const schema = fs.readFileSync(path.join(process.cwd(), "supabase/schema.sql"), "utf8");
const marker = "create or replace function signal_pair_hash";
const idx = schema.indexOf(marker);

const part1 = schema.slice(0, idx).trim();
const rest = schema.slice(idx);
const marker2 = "alter table signal_queue enable row level security";
const idx2 = rest.indexOf(marker2);

const part2 = rest.slice(0, idx2).trim();
const part3 = rest.slice(idx2).trim();

fs.mkdirSync(path.join(process.cwd(), "scripts/schema-chunks"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "scripts/schema-chunks/01-tables.sql"), part1);
fs.writeFileSync(path.join(process.cwd(), "scripts/schema-chunks/02-functions.sql"), part2);
fs.writeFileSync(path.join(process.cwd(), "scripts/schema-chunks/03-rls.sql"), part3);
console.log("chunks written", part1.length, part2.length, part3.length);
