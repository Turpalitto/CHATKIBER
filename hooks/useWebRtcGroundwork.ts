"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModerationResult, VoiceQosRecommendationsResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";
import { getSignalIceConfigSummary, getSignalIceServers, SignalIceConfigSummary } from "@/lib/rtc-config";
import {
  getPreferredInputDeviceId,
  getPreferredOutputDeviceId,
  getPreferredInputGain,
  getPreferredOutputVolume,
  setPreferredInputDeviceId,
  setPreferredOutputDeviceId,
  setPreferredInputGain,
  setPreferredOutputVolume
} from "@/lib/voice-preferences";
import { clamp, uid } from "@/lib/utils";

export type VoiceLinkStatus =
  | "disabled"
  | "idle"
  | "priming"
  | "negotiating"
  | "connected"
  | "reconnecting"
  | "ready"
  | "error";

export type VoicePresenceState = "offline" | "idle" | "tuning" | "listening" | "speaking" | "reconnecting";

interface VoiceDiagnostics {
  connectionState: string;
  iceConnectionState: string;
  signalingState: string;
  reconnectAttempts: number;
  roundTripTimeMs: number | null;
  outboundKbps: number | null;
  inboundKbps: number | null;
  packetsLost: number | null;
  jitterMs: number | null;
  localCandidateType: string | null;
  remoteCandidateType: string | null;
}

type VoicePermissionState = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

interface VoiceDeviceOption {
  deviceId: string;
  label: string;
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface UseWebRtcGroundworkOptions {
  enabled: boolean;
  incomingSignal: WebRtcSignalMessage | null;
  onSendSignal: (signal: WebRtcSignalMessage) => void | Promise<void>;
  onModerateTranscript: (transcript: string) => Promise<ModerationResult>;
  onReportQosSample: (sample: VoiceQosSample) => Promise<VoiceQosReportResult>;
  onLoadQosHistory: () => Promise<VoiceQosSample[]>;
  onFetchRecommendations: (context: Record<string, unknown>) => Promise<VoiceQosRecommendationsResult>;
}

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") {
    return null;
  }

  const windowWithSpeech = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };

  return windowWithSpeech.SpeechRecognition ?? windowWithSpeech.webkitSpeechRecognition ?? null;
}

function defaultDiagnostics(): VoiceDiagnostics {
  return {
    connectionState: "new",
    iceConnectionState: "new",
    signalingState: "stable",
    reconnectAttempts: 0,
    roundTripTimeMs: null,
    outboundKbps: null,
    inboundKbps: null,
    packetsLost: null,
    jitterMs: null,
    localCandidateType: null,
    remoteCandidateType: null
  };
}

function labelDevice(device: MediaDeviceInfo, fallbackPrefix: string, index: number) {
  return device.label || `${fallbackPrefix} ${index + 1}`;
}

export function useWebRtcGroundwork({ enabled, incomingSignal, onSendSignal, onModerateTranscript, onReportQosSample, onLoadQosHistory, onFetchRecommendations }: UseWebRtcGroundworkOptions) {
  const [status, setStatus] = useState<VoiceLinkStatus>(enabled ? "idle" : "disabled");
  const [error, setError] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [level, setLevel] = useState(0);
  const [remoteLevel, setRemoteLevel] = useState(0);
  const [transmitting, setTransmitting] = useState(false);
  const [queuedTransmit, setQueuedTransmit] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [diagnostics, setDiagnostics] = useState<VoiceDiagnostics>(defaultDiagnostics);
  const [inputDevices, setInputDevices] = useState<VoiceDeviceOption[]>([]);
  const [outputDevices, setOutputDevices] = useState<VoiceDeviceOption[]>([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState("");
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState("");
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [permissionState, setPermissionState] = useState<VoicePermissionState>("unknown");
  const [qosHistory, setQosHistory] = useState<VoiceQosSample[]>([]);
  const [healthScore, setHealthScore] = useState(100);
  const [qosAlerts, setQosAlerts] = useState<VoiceQosRecommendationsResult["alerts"]>([]);
  const [serverRecommendations, setServerRecommendations] = useState<VoiceQosRecommendationsResult["recommendations"]>([]);
  const [incidentTimeline, setIncidentTimeline] = useState<VoiceQosRecommendationsResult["incidents"]>([]);
  const [turnRelayRequired, setTurnRelayRequired] = useState(false);
  const [turnRelaySatisfied, setTurnRelaySatisfied] = useState(false);
  const [inputGain, setInputGain] = useState(() => getPreferredInputGain());
  const [outputVolume, setOutputVolume] = useState(() => getPreferredOutputVolume());
  const [testingOutput, setTestingOutput] = useState(false);
  const [testingInput, setTestingInput] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const processedTrackRef = useRef<MediaStreamTrack | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const outputTestAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const localMeterFrameRef = useRef<number | null>(null);
  const remoteMeterFrameRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteSpeakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const senderRef = useRef(onSendSignal);
  const moderationRef = useRef(onModerateTranscript);
  const qosReportRef = useRef(onReportQosSample);
  const qosLoadRef = useRef(onLoadQosHistory);
  const qosRecommendationsRef = useRef(onFetchRecommendations);
  const lastSignalIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptBufferRef = useRef("");
  const transcriptFlushPendingRef = useRef(false);
  const localSenderTagRef = useRef(uid("voice"));
  const remoteSenderTagRef = useRef<string | null>(null);
  const desiredActiveRef = useRef(false);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const holdRequestedRef = useRef(false);
  const lastQosReportAtRef = useRef(0);
  const statsSnapshotRef = useRef<{ outboundBytes: number; inboundBytes: number; timestamp: number } | null>(null);

  useEffect(() => {
    senderRef.current = onSendSignal;
  }, [onSendSignal]);

  useEffect(() => {
    moderationRef.current = onModerateTranscript;
  }, [onModerateTranscript]);

  useEffect(() => {
    qosReportRef.current = onReportQosSample;
  }, [onReportQosSample]);

  useEffect(() => {
    qosLoadRef.current = onLoadQosHistory;
  }, [onLoadQosHistory]);

  useEffect(() => {
    if (!enabled) {
      desiredActiveRef.current = false;
      setStatus("disabled");
      return;
    }

    setStatus((current) => (current === "disabled" ? (micReady ? "ready" : "idle") : current));
  }, [enabled, micReady]);

  const speechSupported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);
  const iceServers = useMemo(() => getSignalIceServers(), []);
  const iceConfigSummary = useMemo<SignalIceConfigSummary>(() => getSignalIceConfigSummary(), []);
  const outputRoutingSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const audio = document.createElement("audio") as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
    return typeof audio.setSinkId === "function";
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("permissions" in navigator) || !navigator.permissions?.query) {
      setPermissionState("unsupported");
      return;
    }

    let active = true;
    let statusHandle: PermissionStatus | null = null;

    const bind = async () => {
      try {
        const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (!active) {
          return;
        }
        statusHandle = result;
        setPermissionState(result.state as VoicePermissionState);
        result.onchange = () => setPermissionState(result.state as VoicePermissionState);
      } catch {
        setPermissionState("unsupported");
      }
    };

    void bind();

    return () => {
      active = false;
      if (statusHandle) {
        statusHandle.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    setPreferredInputGain(inputGain);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = inputGain;
    }
  }, [inputGain]);

  useEffect(() => {
    setPreferredOutputVolume(outputVolume);
    if (audioRef.current) {
      audioRef.current.volume = outputVolume;
    }
    if (outputTestAudioRef.current) {
      outputTestAudioRef.current.volume = outputVolume;
    }
  }, [outputVolume]);

  const localPresence = useMemo<VoicePresenceState>(() => {
    if (!enabled) {
      return "offline";
    }
    if (transmitting) {
      return "speaking";
    }
    if (queuedTransmit || status === "negotiating" || status === "priming") {
      return "tuning";
    }
    if (status === "reconnecting") {
      return "reconnecting";
    }
    if (micReady) {
      return "listening";
    }
    return "idle";
  }, [enabled, micReady, queuedTransmit, status, transmitting]);

  const remotePresence = useMemo<VoicePresenceState>(() => {
    if (!remoteReady) {
      return status === "reconnecting" ? "reconnecting" : "offline";
    }
    if (status === "reconnecting") {
      return "reconnecting";
    }
    return remoteSpeaking ? "speaking" : "listening";
  }, [remoteReady, remoteSpeaking, status]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearRemoteSpeakingTimer = useCallback(() => {
    if (remoteSpeakingTimerRef.current) {
      clearTimeout(remoteSpeakingTimerRef.current);
      remoteSpeakingTimerRef.current = null;
    }
  }, []);

  const stopStatsPolling = useCallback(() => {
    if (statsTimerRef.current) {
      clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
  }, []);

  const stopLocalMeter = useCallback(() => {
    if (localMeterFrameRef.current) {
      cancelAnimationFrame(localMeterFrameRef.current);
      localMeterFrameRef.current = null;
    }
    setLevel(0);
  }, []);

  const stopRemoteMeter = useCallback(() => {
    if (remoteMeterFrameRef.current) {
      cancelAnimationFrame(remoteMeterFrameRef.current);
      remoteMeterFrameRef.current = null;
    }
    setRemoteLevel(0);
    setRemoteSpeaking(false);
    clearRemoteSpeakingTimer();
  }, [clearRemoteSpeakingTimer]);

  const closeRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      // no-op
    }
    recognitionRef.current = null;
  }, []);

  const flushTranscript = useCallback(async () => {
    if (transcriptFlushPendingRef.current) {
      return;
    }

    const transcript = transcriptBufferRef.current.trim();
    transcriptBufferRef.current = "";
    if (!transcript) {
      return;
    }

    transcriptFlushPendingRef.current = true;
    setLastTranscript(transcript);

    try {
      await moderationRef.current(transcript);
    } finally {
      transcriptFlushPendingRef.current = false;
    }
  }, []);

  const syncDiagnosticsFromPeer = useCallback((peer: RTCPeerConnection | null) => {
    setDiagnostics((current) => ({
      ...current,
      connectionState: peer?.connectionState ?? "new",
      iceConnectionState: peer?.iceConnectionState ?? "new",
      signalingState: peer?.signalingState ?? "stable",
      reconnectAttempts: reconnectAttemptRef.current
    }));
  }, []);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({ deviceId: device.deviceId, label: labelDevice(device, "Microphone", index) }));
      const outputs = devices
        .filter((device) => device.kind === "audiooutput")
        .map((device, index) => ({ deviceId: device.deviceId, label: labelDevice(device, "Output", index) }));

      const preferredInput = getPreferredInputDeviceId();
      const preferredOutput = getPreferredOutputDeviceId();
      const resolvedInput = inputs.some((device) => device.deviceId === preferredInput) ? preferredInput : inputs[0]?.deviceId || "";
      const resolvedOutput = outputs.some((device) => device.deviceId === preferredOutput) ? preferredOutput : outputs[0]?.deviceId || "";

      setInputDevices(inputs);
      setOutputDevices(outputs);
      setSelectedInputDeviceId((current) => current || resolvedInput);
      setSelectedOutputDeviceId((current) => current || resolvedOutput);
    } catch {
      // best effort only
    }
  }, []);

  const applyOutputDevice = useCallback(async (deviceId: string) => {
    const audio = audioRef.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!audio || !deviceId || typeof audio.setSinkId !== "function") {
      return;
    }

    try {
      await audio.setSinkId(deviceId);
    } catch {
      // browser / permission dependent
    }
  }, []);

  const replaceOutgoingTrack = useCallback(async (peer: RTCPeerConnection, nextTrack: MediaStreamTrack | null, nextStream: MediaStream | null) => {
    const audioSenders = peer.getSenders().filter((sender) => sender.track?.kind === "audio");

    if (audioSenders.length === 0 && nextTrack && nextStream) {
      peer.addTrack(nextTrack, nextStream);
      return;
    }

    await Promise.all(audioSenders.map((sender) => sender.replaceTrack(nextTrack)));
  }, []);

  const ensureLocalAudio = useCallback(async (deviceId?: string, force = false) => {
    if (!enabled) {
      return;
    }

    const nextDeviceId = deviceId ?? selectedInputDeviceId;
    const shouldRebuild = force || !rawStreamRef.current || !processedTrackRef.current || !audioContextRef.current;
    if (!shouldRebuild) {
      return;
    }

    stopLocalMeter();

    rawStreamRef.current?.getTracks().forEach((track) => track.stop());
    rawStreamRef.current = null;
    processedStreamRef.current?.getTracks().forEach((track) => track.stop());
    processedStreamRef.current = null;
    processedTrackRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    const constraints: MediaStreamConstraints = {
      audio: nextDeviceId ? { deviceId: { exact: nextDeviceId } } : true
    };

    const rawStream = await navigator.mediaDevices.getUserMedia(constraints);
    rawStreamRef.current = rawStream;

    const context = new AudioContext();
    audioContextRef.current = context;

    const source = context.createMediaStreamSource(rawStream);
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 260;

    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3100;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    const gain = context.createGain();
    gain.gain.value = inputGain;
    gainNodeRef.current = gain;

    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const destination = context.createMediaStreamDestination();

    source.connect(analyser);
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(gain);
    gain.connect(destination);

    processedStreamRef.current = destination.stream;
    processedTrackRef.current = destination.stream.getAudioTracks()[0] ?? null;
    if (processedTrackRef.current) {
      processedTrackRef.current.enabled = transmitting;
    }

    await context.resume();

    const peer = peerRef.current;
    if (peer) {
      await replaceOutgoingTrack(peer, processedTrackRef.current, destination.stream);
      syncDiagnosticsFromPeer(peer);
    }

    if (remoteStreamRef.current && remoteStreamRef.current.getTracks().length > 0) {
      remoteSourceRef.current = null;
      remoteAnalyserRef.current = null;
      const stream = remoteStreamRef.current;
      stopRemoteMeter();
      const remoteSource = context.createMediaStreamSource(stream);
      const remoteAnalyser = context.createAnalyser();
      remoteAnalyser.fftSize = 256;
      remoteSource.connect(remoteAnalyser);
      remoteSourceRef.current = remoteSource;
      remoteAnalyserRef.current = remoteAnalyser;
    }

    if (analyserRef.current) {
      const localAnalyser = analyserRef.current;
      const buffer = new Uint8Array(localAnalyser.fftSize);
      let smoothed = 0;
      const tick = () => {
        localAnalyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const sample = (buffer[index] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / buffer.length);
        smoothed = smoothed * 0.78 + rms * 0.22;
        setLevel(clamp(smoothed * 6.5, 0.02, 1));
        localMeterFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }
    if (remoteAnalyserRef.current) {
      const analyserNode = remoteAnalyserRef.current;
      const buffer = new Uint8Array(analyserNode.fftSize);
      const tick = () => {
        analyserNode.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const sample = (buffer[index] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / buffer.length);
        const nextLevel = clamp(rms * 5.5, 0.02, 1);
        setRemoteLevel(nextLevel);
        if (nextLevel > 0.09) {
          clearRemoteSpeakingTimer();
          setRemoteSpeaking(true);
        } else if (nextLevel < 0.05) {
          clearRemoteSpeakingTimer();
          remoteSpeakingTimerRef.current = setTimeout(() => setRemoteSpeaking(false), 260);
        }
        remoteMeterFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }

    setSelectedInputDeviceId(nextDeviceId || rawStream.getAudioTracks()[0]?.getSettings().deviceId || "");
    setMicReady(true);
    await refreshDevices();
  }, [clearRemoteSpeakingTimer, enabled, inputGain, refreshDevices, replaceOutgoingTrack, selectedInputDeviceId, stopLocalMeter, stopRemoteMeter, syncDiagnosticsFromPeer, transmitting]);

  const resetPeerOnly = useCallback(() => {
    const peer = peerRef.current;
    if (peer) {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.onconnectionstatechange = null;
      peer.onsignalingstatechange = null;
      peer.oniceconnectionstatechange = null;
      peer.close();
    }
    peerRef.current = null;
    pendingIceRef.current = [];
    ignoreOfferRef.current = false;
    isSettingRemoteAnswerPendingRef.current = false;
    makingOfferRef.current = false;
    setRemoteReady(false);
    stopRemoteMeter();
    stopStatsPolling();
    statsSnapshotRef.current = null;
    syncDiagnosticsFromPeer(null);
  }, [stopRemoteMeter, stopStatsPolling, syncDiagnosticsFromPeer]);

  const cleanup = useCallback(() => {
    clearReconnectTimer();
    clearRemoteSpeakingTimer();
    stopLocalMeter();
    stopRemoteMeter();
    stopStatsPolling();
    closeRecognition();
    resetPeerOnly();

    rawStreamRef.current?.getTracks().forEach((track) => track.stop());
    rawStreamRef.current = null;

    processedStreamRef.current?.getTracks().forEach((track) => track.stop());
    processedStreamRef.current = null;
    processedTrackRef.current = null;

    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    remoteSourceRef.current = null;
    remoteAnalyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }

    transcriptBufferRef.current = "";
    desiredActiveRef.current = false;
    reconnectAttemptRef.current = 0;
    remoteSenderTagRef.current = null;
    holdRequestedRef.current = false;
    setMicReady(false);
    setRemoteReady(false);
    setTransmitting(false);
    setQueuedTransmit(false);
    setLastTranscript("");
    setDiagnostics(defaultDiagnostics());
    setQosHistory([]);
    setHealthScore(100);
    setQosAlerts([]);
    setServerRecommendations([]);
    setTurnRelayRequired(false);
    setTurnRelaySatisfied(false);
    setStatus(enabled ? "idle" : "disabled");
  }, [clearReconnectTimer, clearRemoteSpeakingTimer, closeRecognition, enabled, resetPeerOnly, stopLocalMeter, stopRemoteMeter, stopStatsPolling]);

  const startMeterLoop = useCallback(
    (
      analyser: AnalyserNode,
      setter: (level: number) => void,
      frameRef: React.MutableRefObject<number | null>,
      options?: { scale?: number; onSpeakingChange?: (level: number) => void }
    ) => {
      const scale = options?.scale ?? 6.5;
      const buffer = new Uint8Array(analyser.fftSize);
      let smoothed = 0;

      const tick = () => {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const sample = (buffer[index] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / buffer.length);
        smoothed = smoothed * 0.78 + rms * 0.22;
        const nextLevel = clamp(smoothed * scale, 0.02, 1);
        setter(nextLevel);
        options?.onSpeakingChange?.(nextLevel);
        frameRef.current = requestAnimationFrame(tick);
      };

      tick();
    },
    []
  );

  const startLocalMeter = useCallback(() => {
    if (analyserRef.current) {
      startMeterLoop(analyserRef.current, setLevel, localMeterFrameRef, { scale: 6.5 });
    }
  }, [startMeterLoop]);

  const handleRemoteSpeakingLevel = useCallback((nextLevel: number) => {
    if (nextLevel > 0.09) {
      clearRemoteSpeakingTimer();
      setRemoteSpeaking(true);
      return;
    }

    if (nextLevel < 0.05) {
      clearRemoteSpeakingTimer();
      remoteSpeakingTimerRef.current = setTimeout(() => setRemoteSpeaking(false), 260);
    }
  }, [clearRemoteSpeakingTimer]);

  const startRemoteMeter = useCallback((stream: MediaStream) => {
    const context = audioContextRef.current;
    if (!context) {
      return;
    }

    stopRemoteMeter();
    remoteSourceRef.current = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    remoteSourceRef.current.connect(analyser);
    remoteAnalyserRef.current = analyser;
    startMeterLoop(analyser, setRemoteLevel, remoteMeterFrameRef, {
      scale: 5.5,
      onSpeakingChange: handleRemoteSpeakingLevel
    });
  }, [handleRemoteSpeakingLevel, startMeterLoop, stopRemoteMeter]);

  const pollStats = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer || peer.connectionState === "closed") {
      return;
    }

    try {
      const report = await peer.getStats();
      let outboundBytes: number | null = null;
      let inboundBytes: number | null = null;
      let packetsLost: number | null = null;
      let jitterMs: number | null = null;
      let roundTripTimeMs: number | null = null;
      let availableOutgoingBitrate: number | null = null;
      let localCandidateType: string | null = null;
      let remoteCandidateType: string | null = null;
      let selectedLocalCandidateId: string | null = null;
      let selectedRemoteCandidateId: string | null = null;
      let timestamp = Date.now();

      report.forEach((stat) => {
        const current = stat as RTCStats & Record<string, unknown>;
        timestamp = typeof current.timestamp === "number" ? current.timestamp : timestamp;

        if (current.type === "candidate-pair" && (current.state === "succeeded" || current.nominated)) {
          if (typeof current.currentRoundTripTime === "number") {
            roundTripTimeMs = current.currentRoundTripTime * 1000;
          }
          if (typeof current.availableOutgoingBitrate === "number") {
            availableOutgoingBitrate = current.availableOutgoingBitrate / 1000;
          }
          if (typeof current.localCandidateId === "string") {
            selectedLocalCandidateId = current.localCandidateId;
          }
          if (typeof current.remoteCandidateId === "string") {
            selectedRemoteCandidateId = current.remoteCandidateId;
          }
        }

        if (current.type === "outbound-rtp" && (current.kind === "audio" || current.mediaType === "audio") && typeof current.bytesSent === "number") {
          outboundBytes = current.bytesSent;
        }

        if (current.type === "inbound-rtp" && (current.kind === "audio" || current.mediaType === "audio")) {
          if (typeof current.bytesReceived === "number") {
            inboundBytes = current.bytesReceived;
          }
          if (typeof current.packetsLost === "number") {
            packetsLost = current.packetsLost;
          }
          if (typeof current.jitter === "number") {
            jitterMs = current.jitter * 1000;
          }
        }

        if (current.type === "local-candidate" && selectedLocalCandidateId && current.id === selectedLocalCandidateId && typeof current.candidateType === "string") {
          localCandidateType = current.candidateType;
        }

        if (current.type === "remote-candidate" && selectedRemoteCandidateId && current.id === selectedRemoteCandidateId && typeof current.candidateType === "string") {
          remoteCandidateType = current.candidateType;
        }
      });

      if (selectedLocalCandidateId || selectedRemoteCandidateId) {
        report.forEach((stat) => {
          const current = stat as RTCStats & Record<string, unknown>;
          if (selectedLocalCandidateId && current.id === selectedLocalCandidateId && typeof current.candidateType === "string") {
            localCandidateType = current.candidateType;
          }
          if (selectedRemoteCandidateId && current.id === selectedRemoteCandidateId && typeof current.candidateType === "string") {
            remoteCandidateType = current.candidateType;
          }
        });
      }

      let outboundKbps: number | null = availableOutgoingBitrate;
      let inboundKbps: number | null = null;
      const previous = statsSnapshotRef.current;

      if (previous && outboundBytes !== null && inboundBytes !== null) {
        const deltaTime = Math.max(1, timestamp - previous.timestamp);
        outboundKbps = ((outboundBytes - previous.outboundBytes) * 8) / deltaTime;
        inboundKbps = ((inboundBytes - previous.inboundBytes) * 8) / deltaTime;
      }

      if (outboundBytes !== null && inboundBytes !== null) {
        statsSnapshotRef.current = { outboundBytes, inboundBytes, timestamp };
      }

      const sample: VoiceQosSample = {
        createdAt: Date.now(),
        connectionState: peer.connectionState,
        iceConnectionState: peer.iceConnectionState,
        signalingState: peer.signalingState,
        roundTripTimeMs,
        outboundKbps,
        inboundKbps,
        packetsLost,
        jitterMs,
        localCandidateType,
        remoteCandidateType
      };

      setDiagnostics({
        connectionState: sample.connectionState,
        iceConnectionState: sample.iceConnectionState,
        signalingState: sample.signalingState,
        reconnectAttempts: reconnectAttemptRef.current,
        roundTripTimeMs: sample.roundTripTimeMs,
        outboundKbps: sample.outboundKbps,
        inboundKbps: sample.inboundKbps,
        packetsLost: sample.packetsLost,
        jitterMs: sample.jitterMs,
        localCandidateType: sample.localCandidateType,
        remoteCandidateType: sample.remoteCandidateType
      });

      if (sample.connectionState === "connected") {
        const now = Date.now();
        if (now - lastQosReportAtRef.current >= 2500) {
          lastQosReportAtRef.current = now;
          void qosReportRef.current(sample).then(async (report) => {
            setQosHistory(report.history);
            setHealthScore(report.healthScore);
            setQosAlerts(report.alerts);
            setServerRecommendations(report.recommendations);
            setTurnRelayRequired(report.turnRelayRequired);
            setTurnRelaySatisfied(report.turnRelaySatisfied);
            if (report.status === "blocked") {
              setError(report.reason ?? "TURN relay policy blocked the active voice path.");
              desiredActiveRef.current = false;
              clearReconnectTimer();
              holdRequestedRef.current = false;
              setQueuedTransmit(false);
              if (processedTrackRef.current) {
                processedTrackRef.current.enabled = false;
              }
              setTransmitting(false);
              closeRecognition();
              try {
                await senderRef.current({
                  id: uid("rtc"),
                  type: "hangup",
                  createdAt: Date.now(),
                  senderTag: localSenderTagRef.current
                });
              } catch {
                // best effort only
              }
              resetPeerOnly();
              setStatus(micReady ? "ready" : enabled ? "idle" : "disabled");
            }
          });
        }
      }
    } catch {
      // diagnostics are best effort only
    }
  }, [clearReconnectTimer, closeRecognition, enabled, micReady, resetPeerOnly]);

  const startStatsPolling = useCallback(() => {
    stopStatsPolling();
    void pollStats();
    statsTimerRef.current = setInterval(() => {
      void pollStats();
    }, 1200);
  }, [pollStats, stopStatsPolling]);

  const attachLocalTracks = useCallback((peer: RTCPeerConnection) => {
    const processedStream = processedStreamRef.current;
    if (!processedStream) {
      return;
    }

    const existingTracks = new Set(peer.getSenders().map((sender) => sender.track?.id).filter(Boolean));
    processedStream.getTracks().forEach((track) => {
      if (!existingTracks.has(track.id)) {
        peer.addTrack(track, processedStream);
      }
    });
  }, []);

  const flushPendingIce = useCallback(async (peer: RTCPeerConnection) => {
    while (pendingIceRef.current.length > 0) {
      const candidate = pendingIceRef.current.shift();
      if (candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // ignore stale candidates during renegotiation
        }
      }
    }
  }, []);

  const sendSignal = useCallback(async (signal: WebRtcSignalMessage) => {
    await senderRef.current({ ...signal, senderTag: signal.senderTag ?? localSenderTagRef.current });
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!enabled || !desiredActiveRef.current || !micReady) {
      return;
    }

    clearReconnectTimer();
    reconnectAttemptRef.current += 1;
    setDiagnostics((current) => ({ ...current, reconnectAttempts: reconnectAttemptRef.current }));
    const delay = Math.min(5000, 900 * reconnectAttemptRef.current);
    setStatus("reconnecting");
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      void sendSignal({
        id: uid("rtc"),
        type: "request-offer",
        createdAt: Date.now()
      });
    }, delay);
  }, [clearReconnectTimer, enabled, micReady, sendSignal]);

  const ensurePeer = useCallback(() => {
    if (!enabled) {
      throw new Error("Voice link is available only in live mode.");
    }

    if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") {
      throw new Error("WebRTC is not available in this environment.");
    }

    if (peerRef.current) {
      return peerRef.current;
    }

    const peer = new RTCPeerConnection({
      iceServers
    });

    remoteStreamRef.current = new MediaStream();
    if (audioRef.current) {
      audioRef.current.srcObject = remoteStreamRef.current;
      void applyOutputDevice(selectedOutputDeviceId);
    }

    attachLocalTracks(peer);
    syncDiagnosticsFromPeer(peer);

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream && audioRef.current) {
        audioRef.current.srcObject = stream;
        void applyOutputDevice(selectedOutputDeviceId);
        void audioRef.current.play().catch(() => undefined);
        startRemoteMeter(stream);
      } else if (remoteStreamRef.current && event.track) {
        remoteStreamRef.current.addTrack(event.track);
        startRemoteMeter(remoteStreamRef.current);
      }

      reconnectAttemptRef.current = 0;
      setRemoteReady(true);
      setStatus("connected");
      startStatsPolling();
      syncDiagnosticsFromPeer(peer);
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      void sendSignal({
        id: uid("rtc"),
        type: "ice",
        candidate: event.candidate.toJSON(),
        createdAt: Date.now()
      });
    };

    peer.onconnectionstatechange = () => {
      syncDiagnosticsFromPeer(peer);

      if (peer.connectionState === "connected") {
        reconnectAttemptRef.current = 0;
        setStatus("connected");
        startStatsPolling();
        return;
      }

      if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
        resetPeerOnly();
        scheduleReconnect();
        return;
      }

      if (peer.connectionState === "closed") {
        setStatus(micReady ? "ready" : "idle");
      }
    };

    peer.onsignalingstatechange = () => {
      syncDiagnosticsFromPeer(peer);
    };

    peer.oniceconnectionstatechange = () => {
      syncDiagnosticsFromPeer(peer);
      if (peer.iceConnectionState === "failed") {
        resetPeerOnly();
        scheduleReconnect();
      }
    };

    peerRef.current = peer;
    return peer;
  }, [applyOutputDevice, attachLocalTracks, enabled, iceServers, micReady, resetPeerOnly, scheduleReconnect, selectedOutputDeviceId, sendSignal, startRemoteMeter, startStatsPolling, syncDiagnosticsFromPeer]);

  const prime = useCallback(async (deviceId?: string, force = false) => {
    if (!enabled) {
      setStatus("disabled");
      return;
    }

    try {
      setError(null);
      setStatus("priming");
      await ensureLocalAudio(deviceId, force);
      const peer = ensurePeer();
      attachLocalTracks(peer);
      setMicReady(true);
      setStatus("ready");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Unable to prime the microphone.");
    }
  }, [attachLocalTracks, enabled, ensureLocalAudio, ensurePeer]);

  const createAndSendOffer = useCallback(async (iceRestart = false) => {
    if (!desiredActiveRef.current) {
      return;
    }

    try {
      const peer = ensurePeer();
      attachLocalTracks(peer);
      makingOfferRef.current = true;
      setStatus(reconnectAttemptRef.current > 0 ? "reconnecting" : "negotiating");
      const offer = await peer.createOffer(iceRestart ? { iceRestart: true } : undefined);
      await peer.setLocalDescription(offer);
      syncDiagnosticsFromPeer(peer);
      await sendSignal({
        id: uid("rtc"),
        type: "offer",
        description: offer,
        createdAt: Date.now()
      });
    } finally {
      makingOfferRef.current = false;
    }
  }, [attachLocalTracks, ensurePeer, sendSignal, syncDiagnosticsFromPeer]);

  const enableVoice = useCallback(async () => {
    desiredActiveRef.current = true;
    reconnectAttemptRef.current = 0;
    setDiagnostics((current) => ({ ...current, reconnectAttempts: 0 }));

    if (!micReady) {
      await prime(selectedInputDeviceId, false);
    }

    setStatus("negotiating");
    await sendSignal({
      id: uid("rtc"),
      type: "request-offer",
      createdAt: Date.now()
    });
  }, [micReady, prime, selectedInputDeviceId, sendSignal]);

  const startRecognition = useCallback(() => {
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor || recognitionRef.current) {
      return;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        const finalParts: string[] = [];
        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          const firstAlternative = result?.[0];
          if (result?.isFinal && firstAlternative?.transcript) {
            finalParts.push(firstAlternative.transcript);
          }
        }

        if (finalParts.length > 0) {
          transcriptBufferRef.current = `${transcriptBufferRef.current} ${finalParts.join(" ")}`.trim();
        }
      };
      recognition.onerror = () => {
        // browser-dependent fallback
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        if (!transmitting) {
          void flushTranscript();
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      recognitionRef.current = null;
    }
  }, [flushTranscript, transmitting]);

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      void flushTranscript();
      return;
    }

    try {
      recognition.stop();
    } catch {
      recognitionRef.current = null;
      void flushTranscript();
    }
  }, [flushTranscript]);

  const activateTransmit = useCallback(() => {
    if (processedTrackRef.current) {
      processedTrackRef.current.enabled = true;
    }
    setQueuedTransmit(false);
    setTransmitting(true);
    startRecognition();
  }, [startRecognition]);

  const startTransmit = useCallback(async () => {
    if (!enabled) {
      return;
    }

    holdRequestedRef.current = true;

    if (!desiredActiveRef.current) {
      setQueuedTransmit(true);
      await enableVoice();
      return;
    }

    if (status !== "connected") {
      setQueuedTransmit(true);
      return;
    }

    activateTransmit();
  }, [activateTransmit, enableVoice, enabled, status]);

  const stopTransmit = useCallback(() => {
    holdRequestedRef.current = false;
    setQueuedTransmit(false);

    if (processedTrackRef.current) {
      processedTrackRef.current.enabled = false;
    }

    setTransmitting(false);
    stopRecognition();
  }, [stopRecognition]);

  const disableVoice = useCallback(async () => {
    desiredActiveRef.current = false;
    clearReconnectTimer();
    stopTransmit();

    try {
      await sendSignal({
        id: uid("rtc"),
        type: "hangup",
        createdAt: Date.now()
      });
    } catch {
      // best effort only
    }

    resetPeerOnly();
    setStatus(micReady ? "ready" : enabled ? "idle" : "disabled");
  }, [clearReconnectTimer, enabled, micReady, resetPeerOnly, sendSignal, stopTransmit]);

  const retryVoiceLink = useCallback(async () => {
    desiredActiveRef.current = true;
    clearReconnectTimer();
    setQueuedTransmit(false);
    setError(null);

    if (!micReady) {
      await prime(selectedInputDeviceId, false);
    }

    const peer = peerRef.current;
    if (peer && peer.signalingState === "stable") {
      await createAndSendOffer(reconnectAttemptRef.current > 0);
      return;
    }

    await sendSignal({
      id: uid("rtc"),
      type: "request-offer",
      createdAt: Date.now()
    });
  }, [clearReconnectTimer, createAndSendOffer, micReady, prime, selectedInputDeviceId, sendSignal]);

  const forceIceRestart = useCallback(async () => {
    desiredActiveRef.current = true;
    clearReconnectTimer();
    setError(null);

    if (!micReady) {
      await prime(selectedInputDeviceId, false);
    }

    const peer = peerRef.current;
    if (!peer || peer.connectionState === "closed") {
      await sendSignal({
        id: uid("rtc"),
        type: "request-offer",
        createdAt: Date.now()
      });
      return;
    }

    await createAndSendOffer(true);
  }, [clearReconnectTimer, createAndSendOffer, micReady, prime, selectedInputDeviceId, sendSignal]);

  const selectInputDevice = useCallback(async (deviceId: string) => {
    setSelectedInputDeviceId(deviceId);
    setPreferredInputDeviceId(deviceId);
    if (!enabled) {
      return;
    }

    try {
      await prime(deviceId, true);
      if (desiredActiveRef.current && peerRef.current?.connectionState === "connected") {
        syncDiagnosticsFromPeer(peerRef.current);
      }
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Could not switch microphone.");
    }
  }, [enabled, prime, syncDiagnosticsFromPeer]);

  const selectOutputDevice = useCallback(async (deviceId: string) => {
    setSelectedOutputDeviceId(deviceId);
    setPreferredOutputDeviceId(deviceId);
    await applyOutputDevice(deviceId);
  }, [applyOutputDevice]);

  const testInputDevice = useCallback(async () => {
    setTestingInput(true);
    try {
      await prime(selectedInputDeviceId, true);
    } finally {
      setTimeout(() => setTestingInput(false), 900);
    }
  }, [prime, selectedInputDeviceId]);

  const testOutputDevice = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    setTestingOutput(true);
    const audio = outputTestAudioRef.current ?? new Audio();
    outputTestAudioRef.current = audio;
    audio.autoplay = false;
    audio.muted = false;
    audio.volume = outputVolume;

    const audioWithSink = audio as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
    if (outputRoutingSupported && typeof audioWithSink.setSinkId === "function" && selectedOutputDeviceId) {
      try {
        await audioWithSink.setSinkId(selectedOutputDeviceId);
      } catch {
        // best effort only
      }
    }

    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    audio.srcObject = destination.stream;
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    const gain = context.createGain();
    gain.gain.value = 0.0001;
    oscillator.connect(gain).connect(destination);
    oscillator.start();
    await context.resume();
    const playPromise = audio.play();
    if (playPromise) {
      await playPromise.catch(() => undefined);
    }
    gain.gain.exponentialRampToValueAtTime(Math.max(0.02, outputVolume * 0.08), context.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);

    window.setTimeout(() => {
      oscillator.stop();
      void context.close();
      setTestingOutput(false);
    }, 700);
  }, [outputRoutingSupported, outputVolume, selectedOutputDeviceId]);

  useEffect(() => {
    if (!enabled || !incomingSignal || lastSignalIdRef.current === incomingSignal.id) {
      return;
    }

    lastSignalIdRef.current = incomingSignal.id;

    const handleSignal = async () => {
      try {
        setError(null);

        if (incomingSignal.senderTag && incomingSignal.senderTag === localSenderTagRef.current) {
          return;
        }

        if (incomingSignal.senderTag) {
          remoteSenderTagRef.current = incomingSignal.senderTag;
        }

        if (incomingSignal.type === "hangup") {
          clearReconnectTimer();
          resetPeerOnly();
          setRemoteReady(false);
          setStatus(micReady ? "ready" : "idle");
          return;
        }

        if (!desiredActiveRef.current) {
          return;
        }

        if (!rawStreamRef.current) {
          await prime(selectedInputDeviceId, false);
        }

        const peer = ensurePeer();
        const polite = Boolean(remoteSenderTagRef.current) && localSenderTagRef.current.localeCompare(remoteSenderTagRef.current as string) < 0;

        if (incomingSignal.type === "request-offer") {
          const remoteTag = remoteSenderTagRef.current ?? "";
          const shouldCreateOffer = localSenderTagRef.current.localeCompare(remoteTag) > 0;
          if (shouldCreateOffer && !makingOfferRef.current && peer.signalingState === "stable") {
            await createAndSendOffer(reconnectAttemptRef.current > 0);
          }
          return;
        }

        if (incomingSignal.type === "offer" && incomingSignal.description) {
          const readyForOffer = !makingOfferRef.current && (peer.signalingState === "stable" || isSettingRemoteAnswerPendingRef.current);
          const offerCollision = !readyForOffer;
          ignoreOfferRef.current = !polite && offerCollision;

          if (ignoreOfferRef.current) {
            return;
          }

          if (offerCollision && peer.signalingState !== "stable") {
            try {
              await peer.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit);
            } catch {
              // best effort rollback
            }
          }

          isSettingRemoteAnswerPendingRef.current = true;
          await peer.setRemoteDescription(new RTCSessionDescription(incomingSignal.description));
          isSettingRemoteAnswerPendingRef.current = false;
          await flushPendingIce(peer);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          syncDiagnosticsFromPeer(peer);
          await sendSignal({
            id: uid("rtc"),
            type: "answer",
            description: answer,
            createdAt: Date.now()
          });
          setStatus("connected");
          return;
        }

        if (incomingSignal.type === "answer" && incomingSignal.description) {
          isSettingRemoteAnswerPendingRef.current = true;
          await peer.setRemoteDescription(new RTCSessionDescription(incomingSignal.description));
          isSettingRemoteAnswerPendingRef.current = false;
          await flushPendingIce(peer);
          syncDiagnosticsFromPeer(peer);
          setStatus("connected");
          return;
        }

        if (incomingSignal.type === "ice" && incomingSignal.candidate) {
          if (peer.remoteDescription) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(incomingSignal.candidate));
            } catch {
              if (!ignoreOfferRef.current) {
                throw new Error("Failed to add ICE candidate.");
              }
            }
          } else {
            pendingIceRef.current.push(incomingSignal.candidate);
          }
        }
      } catch (cause) {
        setStatus("error");
        setError(cause instanceof Error ? cause.message : "Incoming WebRTC signal failed.");
      }
    };

    void handleSignal();
  }, [clearReconnectTimer, createAndSendOffer, enabled, ensurePeer, flushPendingIce, incomingSignal, micReady, prime, resetPeerOnly, selectedInputDeviceId, sendSignal, syncDiagnosticsFromPeer]);

  useEffect(() => {
    if (status === "connected" && holdRequestedRef.current && queuedTransmit && !transmitting) {
      activateTransmit();
    }
  }, [activateTransmit, queuedTransmit, status, transmitting]);

  useEffect(() => {
    void refreshDevices();

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.addEventListener) {
      return;
    }

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, [refreshDevices]);

  useEffect(() => {
    if (selectedOutputDeviceId) {
      void applyOutputDevice(selectedOutputDeviceId);
    }
  }, [applyOutputDevice, selectedOutputDeviceId]);

  useEffect(() => {
    if (!enabled || !desiredActiveRef.current) {
      return;
    }

    void qosLoadRef.current().then((history) => {
      if (history.length > 0) {
        setQosHistory(history);
      }
    });
  }, [enabled, status]);

  useEffect(() => {
    if (!enabled || !desiredActiveRef.current) {
      return;
    }

    void (async () => {
      try {
        const recommendations = await qosRecommendationsRef.current({
          permissionState,
          inputDevicesCount: inputDevices.length,
          outputDevicesCount: outputDevices.length,
          outputRoutingSupported,
          currentStatus: status,
          currentError: error
        });
        setHealthScore(recommendations.healthScore);
        setQosAlerts(recommendations.alerts);
        setServerRecommendations(recommendations.recommendations);
        setTurnRelayRequired(recommendations.turnRelayRequired);
        setTurnRelaySatisfied(recommendations.turnRelaySatisfied);
      } catch {
        // recommendations are best effort only
      }
    })();
  }, [enabled, error, inputDevices.length, outputDevices.length, outputRoutingSupported, permissionState, status]);

  useEffect(() => cleanup, [cleanup]);

  const canTransmit = enabled && desiredActiveRef.current && status === "connected";
  const canQueueTransmit = enabled && status !== "disabled" && status !== "error";

  return {
    supported: enabled && typeof window !== "undefined" && typeof RTCPeerConnection !== "undefined",
    speechSupported,
    outputRoutingSupported,
    permissionState,
    status,
    error,
    micReady,
    remoteReady,
    level,
    remoteLevel,
    transmitting,
    queuedTransmit,
    testingInput,
    testingOutput,
    lastTranscript,
    qosHistory,
    healthScore,
    qosAlerts,
    serverRecommendations,
    incidentTimeline,
    diagnostics,
    iceConfigSummary,
    inputGain,
    outputVolume,
    localPresence,
    remotePresence,
    inputDevices,
    outputDevices,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    canTransmit,
    canQueueTransmit,
    remoteAudioRef: audioRef,
    enableVoice,
    prime,
    startTransmit,
    stopTransmit,
    disableVoice,
    retryVoiceLink,
    forceIceRestart,
    testInputDevice,
    testOutputDevice,
    setInputGain,
    setOutputVolume,
    selectInputDevice,
    selectOutputDevice
  } as const;
}
