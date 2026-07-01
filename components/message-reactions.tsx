"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const QUICK_REACTIONS = ["❤️", "👍", "👀", "😂", "🔥", "💭"];

interface MessageReactionsProps {
  messageId: string;
  reactions: Record<string, number>;
  onReact: (emoji: string) => void;
}

export function MessageReactions({ messageId, reactions, onReact }: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="mt-1 flex items-center gap-1 text-xs">
      {Object.entries(reactions).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-white/70 transition hover:bg-white/10"
        >
          <span>{emoji}</span>
          <span className="text-[10px] text-white/50">{count}</span>
        </button>
      ))}

      <button
        onClick={() => setShowPicker(!showPicker)}
        className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-white/40 transition hover:bg-white/10 hover:text-white/70"
      >
        +
      </button>

      {showPicker && (
        <div className="absolute mt-8 flex gap-1 rounded-2xl border border-white/10 bg-[#0a0f17] p-1.5 shadow-xl">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(emoji);
                setShowPicker(false);
              }}
              className="rounded-lg px-1.5 py-0.5 text-lg transition hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}