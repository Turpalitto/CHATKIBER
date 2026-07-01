"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { RadarStatus } from "@/components/ui/radar-status";

interface TuningLockProps {
  onLocked: () => void;
}

const TARGET = 0.58;
const TOLERANCE = 0.1;
const HOLD_MS = 900;
const AUTO_LOCK_MS = 2800;

export function TuningLock({ onLocked }: TuningLockProps) {
  const { m } = useI18n();
  const [value, setValue] = useState(0.57);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const lockedRef = useRef(false);
  const holdStartedRef = useRef<number | null>(null);
  const onLockedRef = useRef(onLocked);
  onLockedRef.current = onLocked;

  const lock = useCallback(() => {
    if (lockedRef.current) {
      return;
    }
    lockedRef.current = true;
    setHolding(false);
    setProgress(1);
    onLockedRef.current();
  }, []);

  useEffect(() => {
    const autoId = window.setTimeout(lock, AUTO_LOCK_MS);
    return () => window.clearTimeout(autoId);
  }, [lock]);

  useEffect(() => {
    if (!holding) {
      holdStartedRef.current = null;
      if (!lockedRef.current) {
        setProgress(0);
      }
      return;
    }

    holdStartedRef.current = Date.now();
    const intervalId = window.setInterval(() => {
      if (!holdStartedRef.current) {
        return;
      }
      const elapsed = Date.now() - holdStartedRef.current;
      const next = Math.min(1, elapsed / HOLD_MS);
      setProgress(next);
      if (next >= 1) {
        lock();
      }
    }, 30);

    return () => window.clearInterval(intervalId);
  }, [holding, lock]);

  const distance = Math.abs(value - TARGET);
  const aligned = distance < TOLERANCE;
  const bandStart = ((TARGET - TOLERANCE) * 100).toFixed(1);
  const bandWidth = (TOLERANCE * 2 * 100).toFixed(1);

  return (
    <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RadarStatus size="md" />
          <div>
            <p className="text-[11px] font-medium text-violet-100/70">{m.tuning.eyebrow}</p>
            <p className="mt-1 text-sm text-white/75">{aligned ? m.tuning.aligned : m.tuning.adjust}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={lock}
          className="text-[11px] text-white/40 underline-offset-2 transition hover:text-cyan-100/80 hover:underline"
        >
          {m.tuning.skip}
        </button>
      </div>

      <div className="relative mt-4">
        <div
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-cyan-300/25"
          style={{ left: `${bandStart}%`, width: `${bandWidth}%` }}
          aria-hidden
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="relative z-10 w-full accent-cyan-300"
          aria-label={m.tuning.targetBand}
        />
      </div>

      <button
        type="button"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          if (!aligned || lockedRef.current) {
            return;
          }
          setHolding(true);
        }}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        disabled={!aligned || lockedRef.current}
        className={`mt-4 w-full rounded-full border px-4 py-3 text-xs font-medium transition ${
          aligned
            ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/14"
            : "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
        }`}
      >
        {lockedRef.current ? m.tuning.locked : holding ? m.tuning.holding : m.tuning.hold}
      </button>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-cyan-300 transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
