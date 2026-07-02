"use client";

import { useRef, useState } from "react";

interface VoiceMessagePlayerProps {
  audioBlob?: Blob;
  audioData?: string;
  duration: number;
  isSelf?: boolean;
  label?: string;
}

export function VoiceMessagePlayer({ audioBlob, audioData, duration, isSelf = false, label }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const togglePlay = () => {
    if (!audioBlob && !audioData) {
      return;
    }

    if (!audioRef.current) {
      const url = audioBlob ? URL.createObjectURL(audioBlob) : audioData!;
      if (audioBlob) {
        urlRef.current = url;
      }
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
        isSelf ? "border-cyan-400/20 bg-cyan-400/5" : "border-white/10 bg-white/5"
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20"
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-white/50">
          <span>{formatTime(duration)}</span>
          <span>{label ?? "Voice"}</span>
        </div>
      </div>
    </div>
  );
}
