import { NextRequest, NextResponse } from "next/server";
import { getVoiceQosAdminDashboard } from "@/lib/server/signal-service";

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debugToken = searchParams.get("debugToken") ?? "";
    const format = searchParams.get("format") ?? "html";
    const requiredToken = process.env.SIGNAL_DEBUG_EXPORT_TOKEN;

    if (requiredToken && debugToken !== requiredToken) {
      return NextResponse.json({ reason: "Debug export token is invalid." }, { status: 403 });
    }

    const payload = await getVoiceQosAdminDashboard();
    if (format === "json") {
      return NextResponse.json(payload);
    }

    const rows = payload.sessions.map((session) => `
      <tr>
        <td>${htmlEscape(session.sessionId)}</td>
        <td>${session.sampleCount}</td>
        <td>${new Date(session.latestAt).toLocaleString()}</td>
        <td>${session.healthScore}</td>
        <td>${session.turnRelayRequired ? "yes" : "no"}</td>
        <td>${session.turnRelaySatisfied ? "yes" : "no"}</td>
        <td>${session.alerts.map((alert) => htmlEscape(alert.code)).join(", ") || "—"}</td>
      </tr>
    `).join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SIGNAL Admin Voice Diagnostics</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; background:#050505; color:#ecfaff; padding:24px; }
    .panel { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; margin-bottom:16px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th,td { padding:8px; border-bottom:1px solid rgba(255,255,255,0.08); text-align:left; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>SIGNAL Admin Voice Diagnostics</h1>
    <div>Generated: ${new Date(payload.generatedAt).toLocaleString()}</div>
    <div>Sessions: ${payload.sessionCount}</div>
  </div>
  <div class="panel">
    <table>
      <thead><tr><th>Session</th><th>Samples</th><th>Latest</th><th>Health</th><th>TURN Req</th><th>TURN OK</th><th>Alerts</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</body>
</html>`;

    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Admin diagnostics failed." }, { status: 500 });
  }
}
