"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface VoiceMessageRecorderProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function VoiceMessageRecorder({ onSendVoiceMessage, disabled }: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const finalDuration = duration;
        
        if (audioBlob.size > 0 && finalDuration > 0.5) {
          onSendVoiceMessage(audioBlob, finalDuration);
        }
        
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          const next = d + 0.1;
          if (next >= 60) {
            stopRecording();
            return 60;
          }
          return next;
        });
      }, 100);
    } catch (error) {
      console.error("Microphone access error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsProcessing(false);
    setDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={disabled || isProcessing}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 disabled:opacity-40"
          title="Записать голосовое сообщение"
        >
          🎙️
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-300"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
            Остановить ({formatDuration(duration)})
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="text-xs text-white/50">Отправка...</div>
      )}
    </div>
  );
}