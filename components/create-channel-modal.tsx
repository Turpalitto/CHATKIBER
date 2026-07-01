"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, prompt: string) => void;
}

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim() || !prompt.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(name.trim(), prompt.trim());
      setName("");
      setPrompt("");
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="signal-panel w-full max-w-md rounded-3xl p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-cyan-400/70">НОВАЯ ЧАСТОТА</div>
            <div className="text-xl font-medium">Создать канал</div>
          </div>
          <button onClick={onClose} className="text-white/50">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Название канала</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Ночные разговоры"
              maxLength={32}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/50">Тема / промпт</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="О чём будут говорить люди на этом канале?"
              rows={3}
              maxLength={120}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/40"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 text-sm">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-3 text-white/70"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !prompt.trim() || isCreating}
            className="flex-1 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 py-3 text-cyan-200 disabled:opacity-50"
          >
            {isCreating ? "Создаём..." : "Создать канал"}
          </button>
        </div>

        <div className="mt-4 text-center text-[10px] text-white/30">
          Канал будет виден всем. Можно удалить в любое время.
        </div>
      </motion.div>
    </div>
  );
}