import fs from "fs";
import path from "path";

const chunks = ["01-tables.sql", "02-functions.sql", "03-rls.sql"].map((name) =>
  fs.readFileSync(path.join(process.cwd(), "scripts/schema-chunks", name), "utf8")
);

const runner = `(async () => {
  const chunks = ${JSON.stringify(chunks)};
  const editors = window.monaco?.editor?.getEditors?.();
  if (!editors?.[0]) return { ok: false, reason: "no editor" };
  const runBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Run");
  if (!runBtn) return { ok: false, reason: "no run button" };
  for (let i = 0; i < chunks.length; i += 1) {
    editors[0].setValue(chunks[i]);
    runBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
  const body = document.body.innerText;
  const hasError = /error|failed/i.test(body) && !/success/i.test(body);
  return { ok: !hasError, body: body.slice(0, 500) };
})()`;

fs.writeFileSync(path.join(process.cwd(), "scripts/cdp-run-schema.js"), runner);
console.log("runner bytes", runner.length);
