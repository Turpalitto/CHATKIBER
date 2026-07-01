import { getSupabaseServerClient } from "@/lib/supabase/server";
import { moderateMessage } from "@/lib/moderation";
import { uid } from "@/lib/utils";
import { ModerationResult, VoiceDiagnosticsShareResult, VoiceIncidentEvent, VoiceQosAdminDashboardResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";

export type SignalRelayKind =
  | "text"
  | "typing"
  | "voice-pulse"
  | "terminal"
  | "disconnect"
  | "webrtc-request-offer"
  | "webrtc-offer"
  | "webrtc-answer"
  | "webrtc-ice"
  | "webrtc-hangup";

interface ParticipantRow {
  anon_token_hash: string;
  left_at: string | null;
}

interface SessionRow {
  id: string;
  status: string;
  ended_at: string | null;
  expires_at: string;
}

interface VoiceQosRow {
  sample: VoiceQosSample;
  created_at: string;
}

interface VoiceQosShareRow {
  token: string;
  session_id: string;
  anon_token_hash: string;
  expires_at: string;
}

export interface SessionContext {
  session: SessionRow;
  self: ParticipantRow;
  peer: ParticipantRow | null;
}

export function requireSignalServer() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Server Supabase client is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return supabase;
}

export async function resolveSessionContext(sessionId: string, anonTokenHash: string) {
  const supabase = requireSignalServer();

  const [{ data: rawSession, error: sessionError }, { data: rawParticipants, error: participantError }] = await Promise.all([
    supabase
      .from("signal_sessions")
      .select("id, status, ended_at, expires_at")
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("signal_participants")
      .select("anon_token_hash, left_at")
      .eq("session_id", sessionId)
  ]);

  const session = rawSession as SessionRow | null;
  const participants = (rawParticipants ?? []) as ParticipantRow[];

  if (sessionError) {
    throw sessionError;
  }

  if (participantError) {
    throw participantError;
  }

  if (!session) {
    throw new Error("Signal session not found.");
  }

  const self = participants.find((participant) => participant.anon_token_hash === anonTokenHash) ?? null;
  const peer = participants.find((participant) => participant.anon_token_hash !== anonTokenHash) ?? null;

  if (!self || self.left_at) {
    throw new Error("Participant is not active in this signal.");
  }

  return { session, self, peer } satisfies SessionContext;
}

export async function createVoiceDiagnosticsShare(sessionId: string, anonTokenHash: string, requestUrl?: string): Promise<VoiceDiagnosticsShareResult> {
  await resolveSessionContext(sessionId, anonTokenHash);
  const supabase = requireSignalServer();
  const token = uid("diag");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const { error } = await supabase.from("signal_voice_qos_shares").insert({
    token,
    session_id: sessionId,
    anon_token_hash: anonTokenHash,
    expires_at: new Date(expiresAt).toISOString()
  });

  if (error) {
    throw error;
  }

  const base = requestUrl ? new URL(requestUrl).origin : process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = base ? `${base}/api/signal/voice-qos/dashboard?shareToken=${encodeURIComponent(token)}` : `?shareToken=${encodeURIComponent(token)}`;
  return { token, url, expiresAt };
}

export async function resolveVoiceDiagnosticsShare(shareToken: string) {
  const supabase = requireSignalServer();
  const { data, error } = await supabase
    .from("signal_voice_qos_shares")
    .select("token, session_id, anon_token_hash, expires_at")
    .eq("token", shareToken)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const share = data as VoiceQosShareRow | null;
  if (!share) {
    throw new Error("Diagnostics share token not found.");
  }

  if (new Date(share.expires_at).getTime() < Date.now()) {
    throw new Error("Diagnostics share token expired.");
  }

  return share;
}

export async function queueSignalEvent(
  sessionId: string,
  senderTokenHash: string,
  recipientTokenHash: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const supabase = requireSignalServer();
  const { error } = await supabase.from("signal_events").insert({
    session_id: sessionId,
    sender_token_hash: senderTokenHash,
    recipient_token_hash: recipientTokenHash,
    event_type: eventType,
    payload,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });

  if (error) {
    throw error;
  }
}

export async function flagSignal(
  sessionId: string | null,
  anonTokenHash: string,
  category: NonNullable<ModerationResult["category"]>,
  reason: string,
  severity = 2
) {
  const supabase = requireSignalServer();
  await supabase.from("signal_flags").insert({
    session_id: sessionId,
    anon_token_hash: anonTokenHash,
    category,
    reason,
    severity
  });
}

export async function moderateVoiceTranscriptForSession(sessionId: string, anonTokenHash: string, transcript: string) {
  await resolveSessionContext(sessionId, anonTokenHash);
  const normalized = transcript.trim();

  if (!normalized) {
    return { status: "allow" } satisfies ModerationResult;
  }

  const moderation = moderateMessage(normalized);

  if (moderation.status === "block") {
    await flagSignal(sessionId, anonTokenHash, moderation.category ?? "spam", moderation.reason ?? "Blocked voice transcript.", 3);
  }

  if (moderation.status === "warn" && moderation.category) {
    await flagSignal(sessionId, anonTokenHash, moderation.category, moderation.reason ?? "Voice transcript warning.", 1);
  }

  return moderation;
}

function isTurnRelaySatisfied(sample: VoiceQosSample) {
  return sample.localCandidateType === "relay" || sample.remoteCandidateType === "relay";
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzeVoiceQos(history: VoiceQosSample[], options?: { turnRelayRequired?: boolean; context?: Record<string, unknown> }) {
  const latest = history.at(-1) ?? null;
  const turnRelayRequired = Boolean(options?.turnRelayRequired);
  const turnRelaySatisfied = latest ? isTurnRelaySatisfied(latest) : false;

  const rtts = history.map((sample) => sample.roundTripTimeMs).filter((value): value is number => typeof value === "number");
  const jitters = history.map((sample) => sample.jitterMs).filter((value): value is number => typeof value === "number");
  const losses = history.map((sample) => sample.packetsLost).filter((value): value is number => typeof value === "number");
  const latestRtt = latest?.roundTripTimeMs ?? null;
  const latestJitter = latest?.jitterMs ?? null;
  const latestLoss = latest?.packetsLost ?? null;
  const avgRtt = average(rtts);
  const avgJitter = average(jitters);
  const avgLoss = average(losses);
  const recentWindow = history.slice(-6);
  const previousWindow = history.slice(-12, -6);

  const recentAvgRtt = average(recentWindow.map((sample) => sample.roundTripTimeMs).filter((value): value is number => typeof value === "number"));
  const previousAvgRtt = average(previousWindow.map((sample) => sample.roundTripTimeMs).filter((value): value is number => typeof value === "number"));
  const recentAvgJitter = average(recentWindow.map((sample) => sample.jitterMs).filter((value): value is number => typeof value === "number"));
  const previousAvgJitter = average(previousWindow.map((sample) => sample.jitterMs).filter((value): value is number => typeof value === "number"));
  const recentAvgLoss = average(recentWindow.map((sample) => sample.packetsLost).filter((value): value is number => typeof value === "number"));
  const previousAvgLoss = average(previousWindow.map((sample) => sample.packetsLost).filter((value): value is number => typeof value === "number"));

  const alerts: VoiceQosReportResult["alerts"] = [];
  const incidents: VoiceIncidentEvent[] = [];

  if (turnRelayRequired && latest && !turnRelaySatisfied) {
    alerts.push({
      level: "critical",
      code: "turn-policy",
      message: "TURN relay is required for this deployment, but the active voice path is not using relay."
    });
  }

  if (latestRtt !== null && latestRtt > 450) {
    alerts.push({ level: "warn", code: "high-rtt", message: "Round-trip latency is elevated and may cause voice lag." });
  }

  if (latestJitter !== null && latestJitter > 45) {
    alerts.push({ level: "warn", code: "high-jitter", message: "Jitter is elevated and may cause unstable audio." });
  }

  if (latestLoss !== null && latestLoss > 12) {
    alerts.push({ level: "warn", code: "packet-loss", message: "Packet loss is elevated and may produce clipped audio." });
  }

  if (recentAvgRtt !== null && previousAvgRtt !== null && recentAvgRtt - previousAvgRtt > 80) {
    alerts.push({ level: "warn", code: "rtt-trend", message: "Latency is trending upward across the current session." });
  }

  if (recentAvgJitter !== null && previousAvgJitter !== null && recentAvgJitter - previousAvgJitter > 12) {
    alerts.push({ level: "warn", code: "jitter-trend", message: "Jitter is worsening over the latest samples." });
  }

  if (recentAvgLoss !== null && previousAvgLoss !== null && recentAvgLoss - previousAvgLoss > 5) {
    alerts.push({ level: "warn", code: "loss-trend", message: "Packet loss is trending upward across recent samples." });
  }

  const context = options?.context ?? {};
  const permissionState = typeof context.permissionState === "string" ? context.permissionState : null;
  const inputDevicesCount = typeof context.inputDevicesCount === "number" ? context.inputDevicesCount : null;
  const outputDevicesCount = typeof context.outputDevicesCount === "number" ? context.outputDevicesCount : null;
  const currentError = typeof context.currentError === "string" ? context.currentError : null;

  const recommendations: VoiceQosReportResult["recommendations"] = [];

  if (permissionState === "denied") {
    recommendations.push({
      id: "grant-mic",
      title: "Grant microphone access",
      description: "Open browser site settings and re-enable microphone permission before retrying voice.",
      action: "grant-mic-permission"
    });
  }

  if ((inputDevicesCount ?? 1) < 1) {
    recommendations.push({
      id: "connect-mic",
      title: "Connect a microphone",
      description: "No input devices are available. Reconnect your headset or microphone and refresh the device list."
    });
  } else {
    recommendations.push({
      id: "test-mic",
      title: "Verify the microphone path",
      description: "Run a mic test after switching input devices or changing gain.",
      action: "test-mic"
    });
  }

  if ((outputDevicesCount ?? 1) >= 1) {
    recommendations.push({
      id: "test-speaker",
      title: "Verify speaker routing",
      description: "Run the speaker test to confirm the selected output path is correct.",
      action: "test-speaker"
    });
  }

  if (alerts.some((alert) => alert.code === "turn-policy")) {
    recommendations.push({
      id: "configure-turn",
      title: "Use relay transport",
      description: "The server requires TURN relay. Check TURN credentials and force an ICE restart after configuration changes.",
      action: "configure-turn"
    });
  }

  if (alerts.some((alert) => ["high-rtt", "high-jitter", "packet-loss", "rtt-trend", "jitter-trend", "loss-trend"].includes(alert.code))) {
    recommendations.push({
      id: "stabilize-network",
      title: "Stabilize the voice transport",
      description: "Retry voice first. If the path remains unstable, trigger a force ICE restart or switch networks.",
      action: "retry-voice"
    });
  }

  if (currentError) {
    recommendations.push({
      id: "review-error",
      title: "Address the current voice error",
      description: currentError,
      action: "retry-voice"
    });
  }

  let healthScore = 100;
  if (avgRtt !== null) healthScore -= Math.min(25, avgRtt / 25);
  if (avgJitter !== null) healthScore -= Math.min(20, avgJitter / 4);
  if (avgLoss !== null) healthScore -= Math.min(25, avgLoss * 1.5);
  if (alerts.some((alert) => alert.level === "critical")) healthScore -= 25;
  if (alerts.some((alert) => alert.code.endsWith("-trend"))) healthScore -= 10;
  healthScore = Math.max(0, Math.round(healthScore));

  return {
    healthScore,
    alerts,
    recommendations,
    turnRelayRequired,
    turnRelaySatisfied,
    latestSample: latest,
    incidents
  };
}

export async function loadVoiceQosHistory(sessionId: string, anonTokenHash: string, limit = 60) {
  await resolveSessionContext(sessionId, anonTokenHash);
  const supabase = requireSignalServer();
  const { data, error } = await supabase
    .from("signal_voice_qos_samples")
    .select("sample, created_at")
    .eq("session_id", sessionId)
    .eq("anon_token_hash", anonTokenHash)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as VoiceQosRow[]).map((row) => row.sample);
}

export async function persistVoiceQosSample(sessionId: string, anonTokenHash: string, sample: VoiceQosSample): Promise<VoiceQosReportResult> {
  const context = await resolveSessionContext(sessionId, anonTokenHash);
  const supabase = requireSignalServer();
  const turnRelayRequired = process.env.SIGNAL_ENFORCE_TURN_RELAY === "1";
  const relaySatisfied = isTurnRelaySatisfied(sample);

  const { error } = await supabase.from("signal_voice_qos_samples").insert({
    session_id: sessionId,
    anon_token_hash: anonTokenHash,
    sample,
    expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  });

  if (error) {
    throw error;
  }

  const history = await loadVoiceQosHistory(sessionId, anonTokenHash);
  const analysis = analyzeVoiceQos(history, { turnRelayRequired });

  if (turnRelayRequired && sample.connectionState === "connected" && !relaySatisfied) {
    await flagSignal(sessionId, anonTokenHash, "policy", "TURN relay is required for this deployment, but the active ICE path is not using relay.", 2);
    if (context.peer) {
      await queueSignalEvent(sessionId, anonTokenHash, context.peer.anon_token_hash, "webrtc-hangup", {
        signal: {
          id: uid("rtc"),
          type: "hangup",
          createdAt: Date.now(),
          senderTag: "policy-enforcer"
        },
        createdAt: Date.now()
      });
    }

    return {
      status: "blocked",
      reason: "TURN relay required. The active voice path is not using relay.",
      history,
      turnRelayRequired,
      turnRelaySatisfied: relaySatisfied,
      healthScore: analysis.healthScore,
      alerts: analysis.alerts,
      recommendations: analysis.recommendations,
      incidents: analysis.incidents
    };
  }

  const severeQos = analysis.alerts.some((alert) => alert.code === "high-rtt" || alert.code === "high-jitter" || alert.code === "packet-loss");
  if (severeQos) {
    await flagSignal(sessionId, anonTokenHash, "policy", "Voice QoS degraded beyond recommended thresholds.", 1);
    return {
      status: "warn",
      reason: "Voice quality is degraded. Retry voice or force ICE restart.",
      history,
      turnRelayRequired,
      turnRelaySatisfied: relaySatisfied,
      healthScore: analysis.healthScore,
      alerts: analysis.alerts,
      recommendations: analysis.recommendations,
      incidents: analysis.incidents
    };
  }

  return {
    status: "ok",
    history,
    turnRelayRequired,
    turnRelaySatisfied: relaySatisfied,
    healthScore: analysis.healthScore,
    alerts: analysis.alerts,
    recommendations: analysis.recommendations,
    incidents: analysis.incidents
  };
}

export async function getVoiceQosRecommendations(sessionId: string, anonTokenHash: string, context: Record<string, unknown> = {}) {
  const history = await loadVoiceQosHistory(sessionId, anonTokenHash);
  return analyzeVoiceQos(history, {
    turnRelayRequired: process.env.SIGNAL_ENFORCE_TURN_RELAY === "1",
    context
  });
}

export async function exportVoiceDiagnostics(sessionId: string, anonTokenHash: string): Promise<import("@/lib/types").VoiceQosExportResult> {
  const history = await loadVoiceQosHistory(sessionId, anonTokenHash);
  const summary = analyzeVoiceQos(history, {
    turnRelayRequired: process.env.SIGNAL_ENFORCE_TURN_RELAY === "1"
  });

  return {
    sessionId,
    exportedAt: Date.now(),
    healthScore: summary.healthScore,
    alerts: summary.alerts,
    recommendations: summary.recommendations,
    turnRelayRequired: summary.turnRelayRequired,
    turnRelaySatisfied: summary.turnRelaySatisfied,
    incidents: summary.incidents,
    history
  };
}

export async function getVoiceQosAdminDashboard(limitSessions = 25): Promise<VoiceQosAdminDashboardResult> {
  const supabase = requireSignalServer();
  const { data, error } = await supabase
    .from("signal_voice_qos_samples")
    .select("session_id, anon_token_hash, sample, created_at")
    .order("created_at", { ascending: false })
    .limit(limitSessions * 40);

  if (error) {
    throw error;
  }

  const grouped = new Map<string, VoiceQosSample[]>();
  for (const row of (data ?? []) as Array<{ session_id: string; sample: VoiceQosSample }>) {
    const current = grouped.get(row.session_id) ?? [];
    current.push(row.sample);
    grouped.set(row.session_id, current);
  }

  const sessions = Array.from(grouped.entries())
    .slice(0, limitSessions)
    .map(([sessionId, history]) => {
      const sorted = history.sort((a, b) => a.createdAt - b.createdAt);
      const summary = analyzeVoiceQos(sorted, {
        turnRelayRequired: process.env.SIGNAL_ENFORCE_TURN_RELAY === "1"
      });
      return {
        sessionId,
        sampleCount: sorted.length,
        latestAt: sorted.at(-1)?.createdAt ?? Date.now(),
        healthScore: summary.healthScore,
        alerts: summary.alerts,
        turnRelayRequired: summary.turnRelayRequired,
        turnRelaySatisfied: summary.turnRelaySatisfied
      };
    })
    .sort((a, b) => b.latestAt - a.latestAt);

  return {
    generatedAt: Date.now(),
    sessionCount: sessions.length,
    sessions
  };
}

export async function relaySignalPayload(params: {
  sessionId: string;
  anonTokenHash: string;
  kind: SignalRelayKind;
  text?: string;
  systemText?: string;
  active?: boolean;
  level?: number;
  signal?: WebRtcSignalMessage;
}) {
  const context = await resolveSessionContext(params.sessionId, params.anonTokenHash);

  if (context.session.ended_at || ["ended", "expired", "flagged"].includes(context.session.status)) {
    throw new Error("Signal session is no longer active.");
  }

  if (!context.peer) {
    throw new Error("No peer is currently attached to this signal.");
  }

  if (params.kind === "text") {
    const normalized = params.text?.trim() ?? "";
    if (!normalized) {
      throw new Error("Message text is required.");
    }

    const moderation = moderateMessage(normalized);
    if (moderation.status === "block") {
      await flagSignal(params.sessionId, params.anonTokenHash, moderation.category ?? "spam", moderation.reason ?? "Blocked by server moderation.", 3);
      return { ok: false as const, moderation };
    }

    if (moderation.status === "warn" && moderation.category) {
      await flagSignal(params.sessionId, params.anonTokenHash, moderation.category, moderation.reason ?? "Warning raised by server moderation.", 1);
    }

    const outgoingText = moderation.maskedText ?? normalized;
    const messageId = uid("msg");

    await queueSignalEvent(params.sessionId, params.anonTokenHash, context.peer.anon_token_hash, "text", {
      id: messageId,
      text: outgoingText,
      createdAt: Date.now()
    });

    return {
      ok: true as const,
      text: outgoingText,
      moderation: moderation.status === "warn" ? moderation : undefined
    };
  }

  if (params.kind === "typing") {
    await queueSignalEvent(params.sessionId, params.anonTokenHash, context.peer.anon_token_hash, "typing", {
      active: Boolean(params.active),
      createdAt: Date.now()
    });
    return { ok: true as const };
  }

  if (params.kind === "voice-pulse") {
    const level = typeof params.level === "number" ? params.level : 0;
    await queueSignalEvent(params.sessionId, params.anonTokenHash, context.peer.anon_token_hash, "voice-pulse", {
      level,
      text: level > 0.5 ? "Voice burst transmitted." : "Soft transmission sent.",
      createdAt: Date.now()
    });
    return { ok: true as const };
  }

  if (params.kind === "terminal") {
    const command = typeof params.text === "string" ? params.text.trim() : "";
    const systemText = typeof params.systemText === "string" ? params.systemText.trim() : "";
    if (!command || !systemText) {
      throw new Error("Terminal relay requires command and system text.");
    }

    await queueSignalEvent(params.sessionId, params.anonTokenHash, context.peer.anon_token_hash, "terminal", {
      command,
      text: systemText,
      createdAt: Date.now()
    });
    return { ok: true as const };
  }

  if (params.kind === "disconnect") {
    await requireSignalServer().rpc("leave_signal_session", {
      p_session_id: params.sessionId,
      p_anon_token_hash: params.anonTokenHash
    });
    await queueSignalEvent(params.sessionId, params.anonTokenHash, context.peer.anon_token_hash, "disconnect", {
      reason: params.text ?? "The signal closed.",
      createdAt: Date.now()
    });
    return { ok: true as const };
  }

  if (!params.signal) {
    throw new Error("WebRTC signaling payload is required.");
  }

  await queueSignalEvent(params.sessionId, params.anonTokenHash, context.peer.anon_token_hash, params.kind, {
    signal: params.signal,
    createdAt: Date.now()
  });

  return { ok: true as const };
}

export async function consumeSignalEvents(sessionId: string, anonTokenHash: string) {
  await resolveSessionContext(sessionId, anonTokenHash);
  const supabase = requireSignalServer();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("signal_events")
    .select("id, event_type, payload, created_at")
    .eq("session_id", sessionId)
    .eq("recipient_token_hash", anonTokenHash)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const ids = data?.map((event) => event.id) ?? [];
  if (ids.length > 0) {
    await supabase.from("signal_events").delete().in("id", ids);
  }

  return data ?? [];
}
