"use client";

import { useState } from "react";
import { useFutureMode } from "@/components/future-mode-provider";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { MemoryImprintViz } from "@/components/memory-imprint-viz";
import { SessionFeedback } from "@/components/session-feedback";
import { DeadDropPanel } from "@/components/dead-drop-panel";
import { formatReceiptDuration } from "@/lib/session-receipt";
import { Frequency, SessionReceipt, DeadDrop } from "@/lib/types";

interface SessionReceiptPanelProps {
  receipt: SessionReceipt;
  frequency: Frequency | null;
  onContinue: () => void;
  onTryAgain?: () => void;
  onLeaveDeadDrop: (body: string) => Promise<any>;
  deadDrops?: DeadDrop[];
  onOpenDeadDrops?: () => void;
}

export function SessionReceiptPanel({
  receipt,
  frequency,
  onContinue,
  onTryAgain,
  onLeaveDeadDrop,
  deadDrops = [],
  onOpenDeadDrops
}: SessionReceiptPanelProps) {
  const m = useFutureCopy();
  const { enabled: futureMode } = useFutureMode();
  const r = m.receipt;
  const [showDrop, setShowDrop] = useState(false);
  const [drop, setDrop] = useState("");
  const [saving, setSaving] = useState(false);

  const submitDrop = async () => {
    if (!drop.trim()) {
      return;
    }
    setSaving(true);
    try {
      await onLeaveDeadDrop(drop.trim());
      setDrop("");
      setShowDrop(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="signal-panel mx-auto w-full max-w-md rounded-[28px] p-8 text-center">
      <h2 className={`display-font text-2xl sm:text-3xl ${futureMode ? "hologram-text" : "text-white"}`}>{r.titleShort}</h2>
      {!futureMode ? <p className="mt-3 text-sm text-white/62">{r.thankYou}</p> : null}
      <p className={`text-sm leading-6 text-white/60 ${futureMode ? "mt-3" : "mt-2"}`}>{receipt.summaryLine}</p>
      <p className="mt-2 text-xs text-white/40">
        {r.duration}: {formatReceiptDuration(receipt.durationSeconds)}
      </p>

      {!futureMode ? <SessionFeedback question={r.feedbackQuestion} thanks={r.feedbackThanks} /> : null}

      {futureMode && receipt.memoryImprint ? (
        <MemoryImprintViz
          imprint={receipt.memoryImprint}
          labels={{
            title: m.future.consciousness.imprintTitle,
            imprint: m.future.consciousness.imprintStrength,
            diffusion: m.future.consciousness.diffusion,
            dominant: m.future.consciousness.dominant,
            axes: m.future.consciousness.axes,
            trajectory: m.future.consciousness.trajectory,
            lattice: m.future.consciousness.latticeTitle,
            noovector: m.future.consciousness.noovector,
            predictions: m.future.consciousness.predictions,
            echo: m.future.consciousness.echo
          }}
        />
      ) : null}

      {onTryAgain && !futureMode ? (
        <button
          type="button"
          onClick={onTryAgain}
          className="mt-6 w-full rounded-full border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-medium text-white/78 transition hover:border-cyan-300/20 hover:text-cyan-50"
        >
          {r.again}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        className={`w-full rounded-full border border-cyan-300/25 bg-cyan-300/10 px-6 py-4 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/14 ${
          onTryAgain && !futureMode ? "mt-3" : "mt-8"
        }`}
      >
        {r.continue}
      </button>

      {/* Dead Drop Section - улучшенная версия */}
      {frequency && (
        <div className="mt-6">
          <button
            onClick={onOpenDeadDrops}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/80 transition hover:border-cyan-400/30 hover:bg-white/10"
          >
            <span>🕳️</span>
            <span>Dead Drop • {deadDrops.length} заметок</span>
          </button>
          <div className="mt-1.5 text-center text-[10px] text-white/35">
            Анонимные сообщения на этой частоте
          </div>
        </div>
      )}
    </div>
  );
}
