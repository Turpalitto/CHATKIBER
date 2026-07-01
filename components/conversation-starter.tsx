"use client";

interface ConversationStarterProps {
  eyebrow: string;
  hint: string;
  prompt: string;
}

export function ConversationStarter({ eyebrow, hint, prompt }: ConversationStarterProps) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/6 px-4 py-3 text-left">
      <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/50">{eyebrow}</p>
      <p className="mt-1 text-sm leading-6 text-white/82">{prompt}</p>
      <p className="mt-2 text-[11px] text-white/42">{hint}</p>
    </div>
  );
}
