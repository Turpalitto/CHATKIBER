"use client";

import { useEffect, useState } from "react";
import { clearSessionFeedback, readSessionFeedback, saveSessionFeedback, SessionFeedbackValue } from "@/lib/session-feedback";

interface SessionFeedbackProps {
  question: string;
  thanks: string;
}

export function SessionFeedback({ question, thanks }: SessionFeedbackProps) {
  const [value, setValue] = useState<SessionFeedbackValue | null>(null);

  useEffect(() => {
    setValue(readSessionFeedback());
    return () => clearSessionFeedback();
  }, []);

  const pick = (next: SessionFeedbackValue) => {
    saveSessionFeedback(next);
    setValue(next);
  };

  if (value) {
    return <p className="mt-4 text-sm text-white/55">{thanks}</p>;
  }

  return (
    <div className="mt-5">
      <p className="text-sm text-white/60">{question}</p>
      <div className="mt-3 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => pick("up")}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-lg transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
          aria-label="Good"
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => pick("down")}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-lg transition hover:border-white/10 hover:bg-white/8"
          aria-label="Not great"
        >
          👎
        </button>
      </div>
    </div>
  );
}
