import { NextRequest, NextResponse } from "next/server";
import { exportVoiceDiagnostics, resolveVoiceDiagnosticsShare } from "@/lib/server/signal-service";

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
    let sessionId = searchParams.get("sessionId") ?? "";
    let anonTokenHash = searchParams.get("anonTokenHash") ?? "";
    const shareToken = searchParams.get("shareToken") ?? "";
    const debugToken = searchParams.get("debugToken") ?? "";
    const format = searchParams.get("format") ?? "html";
    const requiredToken = process.env.SIGNAL_DEBUG_EXPORT_TOKEN;

    if (shareToken) {
      const share = await resolveVoiceDiagnosticsShare(shareToken);
      sessionId = share.session_id;
      anonTokenHash = share.anon_token_hash;
    }

    if (!sessionId || !anonTokenHash) {
      return NextResponse.json({ reason: "sessionId and anonTokenHash or shareToken are required." }, { status: 400 });
    }

    if (!shareToken && requiredToken && debugToken !== requiredToken) {
      return NextResponse.json({ reason: "Debug export token is invalid." }, { status: 403 });
    }

    const payload = await exportVoiceDiagnostics(sessionId, anonTokenHash);

    if (format === "json") {
      return NextResponse.json(payload);
    }

    const alerts = payload.alerts.map((alert) => `<li><strong>${htmlEscape(alert.code)}</strong>: ${htmlEscape(alert.message)}</li>`).join("") || "<li>None</li>";
    const recommendations = payload.recommendations.map((item) => `<li><strong>${htmlEscape(item.title)}</strong>: ${htmlEscape(item.description)}</li>`).join("") || "<li>None</li>";
    const incidents = payload.incidents.map((incident) => `<li><strong>${new Date(incident.createdAt).toLocaleString()}</strong> — ${htmlEscape(incident.title)}: ${htmlEscape(incident.details)}</li>`).join("") || "<li>None</li>";
    const historyRows = payload.history.map((sample) => `
      <tr>
        <td>${new Date(sample.createdAt).toLocaleTimeString()}</td>
        <td>${sample.connectionState}</td>
        <td>${sample.iceConnectionState}</td>
        <td>${sample.signalingState}</td>
        <td>${sample.roundTripTimeMs ?? "—"}</td>
        <td>${sample.jitterMs ?? "—"}</td>
        <td>${sample.packetsLost ?? "—"}</td>
        <td>${sample.localCandidateType ?? "—"} → ${sample.remoteCandidateType ?? "—"}</td>
      </tr>
    `).join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SIGNAL Voice Diagnostics</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; background:#050505; color:#ecfaff; padding:24px; }
    .panel { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; margin-bottom:16px; }
    h1,h2 { margin:0 0 12px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th,td { padding:8px; border-bottom:1px solid rgba(255,255,255,0.08); text-align:left; }
    .muted { color:rgba(236,250,255,0.6); }
  </style>
</head>
<body>
  <h1>SIGNAL Voice Diagnostics</h1>
  <div class="panel">
    <div>Session ID: <span class="muted">${htmlEscape(payload.sessionId)}</span></div>
    <div>Exported: <span class="muted">${new Date(payload.exportedAt).toLocaleString()}</span></div>
    <div>Health score: <strong>${payload.healthScore}</strong></div>
    <div>TURN required: <strong>${payload.turnRelayRequired ? "yes" : "no"}</strong></div>
    <div>TURN satisfied: <strong>${payload.turnRelaySatisfied ? "yes" : "no"}</strong></div>
  </div>
  <div class="panel"><h2>Alerts</h2><ul>${alerts}</ul></div>
  <div class="panel"><h2>Recommendations</h2><ul>${recommendations}</ul></div>
  <div class="panel"><h2>Incident Timeline</h2><ul>${incidents}</ul></div>
  <div class="panel">
    <h2>History</h2>
    <table>
      <thead><tr><th>Time</th><th>Conn</th><th>ICE</th><th>Signal</th><th>RTT</th><th>Jitter</th><th>Loss</th><th>Path</th></tr></thead>
      <tbody>${historyRows}</tbody>
    </table>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Voice diagnostics dashboard failed." }, { status: 500 });
  }
}
