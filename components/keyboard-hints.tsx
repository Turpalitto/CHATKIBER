"use client";

import { useState } from "react";

export function KeyboardHints() {
  const [show, setShow] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setShow(!show)}
        className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white/50 hover:text-white/80"
      >
        ⌘K
      </button>

      {show && (
        <div className="absolute bottom-10 right-0 w-64 rounded-2xl border border-white/10 bg-[#0a0f17] p-4 text-xs text-white/70">
          <div className="mb-3 text-white/50">Горячие клавиши</div>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span>Открыть инструменты</span><span className="font-mono">⌘K</span></div>
            <div className="flex justify-between"><span>Закрыть панель</span><span className="font-mono">Esc</span></div>
            <div className="flex justify-between"><span>Голосовой режим</span><span className="font-mono">/</span></div>
            <div className="flex justify-between"><span>Отправить сообщение</span><span className="font-mono">Enter</span></div>
          </div>
        </div>
      )}
    </div>
  );
}