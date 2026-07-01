import fs from "fs";
import path from "path";

const chunkName = process.argv[2];
if (!chunkName) {
  console.error("Usage: node scripts/make-cdp-expr.mjs 01-tables.sql");
  process.exit(1);
}

const sql = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "scripts/schema-chunks", `${chunkName}.json`), "utf8")
);

const expr = `(sql => {
  const editor = window.monaco?.editor?.getEditors?.()?.[0];
  if (!editor) return "no editor";
  editor.setValue(sql);
  const runBtn = Array.from(document.querySelectorAll("button")).find((btn) => /run/i.test(btn.textContent || ""));
  runBtn?.click();
  return "started";
})(${JSON.stringify(sql)})`;

fs.writeFileSync(path.join(process.cwd(), "scripts/cdp-expr.txt"), expr);
console.log(expr.length);
