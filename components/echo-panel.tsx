"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface EchoPanelProps {
  frequencyLabel: string;
  onLeaveEcho: (text: string) => void;
  onClose: () => void;
}

export function EchoPanel({ frequencyLabel, onLeaveEcho, onClose }: EchoPanelProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    await onLeaveEcho(text.trim());
    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="signal-panel w-full max-w-md rounded-3xl p-6"
      >
        <div className="mb-5">
          <div className="text-xs text-amber-400/70">ЭХО ЧАСТОТЫ</div>
          <div className="text-xl font-medium">{frequencyLabel}</div>
          <p className="mt-2 text-sm text-white/60">
            Оставь анонимное сообщение тем, кто придёт сюда после тебя.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напиши что-то важное или красивое..."
          maxLength={180}
          rows={4}
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white placeholder:text-white/40"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-3 text-sm text-white/70"
          >
            Отмена
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="flex-1 rounded-2xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm text-amber-300 disabled:opacity-50"
          >
            {isSending ? "Отправка..." : "Оставить эхо"}
          </button>
        </div>

        <div className="mt-3 text-center text-[10px] text-white/30">
          Эхо будет видно следующим людям на этой частоте
        </div>
      </motion.div>
    </div>
  );
}