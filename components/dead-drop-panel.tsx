"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/components/locale-provider";
import { DeadDrop, Frequency } from "@/lib/types";
import { getDeadDropTimeLeft } from "@/lib/dead-drop";

interface DeadDropPanelProps {
  frequency: Frequency | null;
  drops: DeadDrop[];
  onLeaveDrop: (body: string) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export function DeadDropPanel({
  frequency,
  drops,
  onLeaveDrop,
  onClose,
  isOpen
}: DeadDropPanelProps) {
  const sortedDrops = [...drops].sort((a, b) => b.createdAt - a.createdAt);
  const { m, locale } = useI18n();
  const panel = m.experience.deadDropPanel;
  const [newDrop, setNewDrop] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!newDrop.trim() || !frequency) return;

    setIsSubmitting(true);
    try {
      await onLeaveDrop(newDrop.trim());
      setNewDrop("");
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="signal-panel w-full max-w-lg rounded-3xl p-6"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-cyan-400/80">{panel.title.toUpperCase()}</div>
            <div className="text-xl font-medium text-white">
              {frequency?.channelLabel || frequency?.prompt || "Частота"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Leave new drop */}
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/80 transition hover:border-cyan-400/30 hover:bg-white/10"
            >
              + {panel.leave}
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={newDrop}
                onChange={(e) => setNewDrop(e.target.value)}
                placeholder={panel.placeholder}
                maxLength={160}
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/40 focus:outline-none"
              />
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setNewDrop("");
                  }}
                  className="flex-1 rounded-xl border border-white/10 py-2 text-white/60 hover:bg-white/5"
                >
                  {m.experience.echo.cancel}
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={!newDrop.trim() || isSubmitting}
                  className="flex-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-2 text-cyan-200 disabled:opacity-50"
                >
                  {isSubmitting ? panel.submitting : panel.submit}
                </button>
              </div>
              <div className="text-right text-[10px] text-white/30">
                {newDrop.length}/160
              </div>
            </div>
          )}
        </div>

        {/* Drops list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Анонимные сообщения ({sortedDrops.length})</span>
            <span>48ч жизни</span>
          </div>

          <AnimatePresence>
            {sortedDrops.length > 0 ? (
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {sortedDrops.map((drop, index) => (
                  <motion.div
                    key={drop.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"
                  >
                    <div className="text-sm leading-snug text-white/90">
                      {drop.body}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-white/40">
                      <span>{getDeadDropTimeLeft(drop)} осталось</span>
                      <span>
                        {new Date(drop.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.015] py-8 text-center text-sm text-white/40">
                {panel.empty}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 text-center text-[10px] text-white/30">{m.deadDrop.description}</div>
      </motion.div>
    </div>
  );
}