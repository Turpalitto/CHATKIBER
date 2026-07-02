import { uid } from "@/lib/utils";
import { EngineEvent } from "@/lib/signal-engine";
import { WebRtcSignalMessage } from "@/lib/types";

export interface RelayEventRow {
  event_type: string;
  payload: Record<string, unknown>;
}

export function dispatchRelayEvent(event: RelayEventRow, emit: (event: EngineEvent) => void) {
  if (event.event_type === "text") {
    emit({
      type: "message",
      message: {
        id: typeof event.payload.id === "string" ? event.payload.id : uid("msg"),
        sender: "peer",
        type: "text",
        text: typeof event.payload.text === "string" ? event.payload.text : "",
        createdAt: typeof event.payload.createdAt === "number" ? event.payload.createdAt : Date.now()
      }
    });
    return;
  }

  if (event.event_type === "typing") {
    emit({ type: "typing", active: Boolean(event.payload.active) });
    return;
  }

  if (event.event_type === "voice-pulse") {
    emit({
      type: "message",
      message: {
        id: uid("msg"),
        sender: "peer",
        type: "voice",
        text: typeof event.payload.text === "string" ? event.payload.text : "Voice burst received.",
        createdAt: typeof event.payload.createdAt === "number" ? event.payload.createdAt : Date.now()
      }
    });
    return;
  }

  if (event.event_type === "voice-message") {
    const duration = typeof event.payload.audioDuration === "number" ? event.payload.audioDuration : 0;
    emit({
      type: "message",
      message: {
        id: typeof event.payload.id === "string" ? event.payload.id : uid("msg"),
        sender: "peer",
        type: "voice",
        text: "",
        audioData: typeof event.payload.audioData === "string" ? event.payload.audioData : undefined,
        audioDuration: duration,
        createdAt: typeof event.payload.createdAt === "number" ? event.payload.createdAt : Date.now()
      }
    });
    return;
  }

  if (event.event_type === "terminal") {
    emit({
      type: "message",
      message: {
        id: uid("msg"),
        sender: "peer",
        type: "system",
        text: typeof event.payload.text === "string" ? event.payload.text : "",
        createdAt: typeof event.payload.createdAt === "number" ? event.payload.createdAt : Date.now()
      }
    });
    return;
  }

  if (event.event_type === "disconnect") {
    emit({
      type: "disconnected",
      reason: typeof event.payload.reason === "string" ? event.payload.reason : "The remote signal closed."
    });
    return;
  }

  if (["webrtc-request-offer", "webrtc-offer", "webrtc-answer", "webrtc-ice", "webrtc-hangup"].includes(event.event_type)) {
    const signal = event.payload.signal as WebRtcSignalMessage | undefined;
    if (signal) {
      emit({ type: "webrtc-signal", signal });
    }
  }
}
