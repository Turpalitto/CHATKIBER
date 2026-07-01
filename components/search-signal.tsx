"use client";

import { useEffect, useMemo, useState } from "react";
import { useFutureMode } from "@/components/future-mode-provider";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { formatMessage } from "@/lib/i18n";
import { getFrequencyDisplayLabel } from "@/lib/frequency-label";
import { computeSynapticScore, predictLinkEtaSeconds } from "@/lib/neural-link";
import { computeBranchProbability } from "@/lib/consciousness/branch-field";
import { computeMeshScan } from "@/lib/mesh-nodes";
import { Frequency, ModeOption, SearchPhase, ToneOption } from "@/lib/types";
import { MeshNodeScanner } from "@/components/mesh-node-scanner";
import { MultiverseBranches } from "@/components/multiverse-branches";
import { NeuralHandshake } from "@/components/neural-handshake";
import { RadarStatus } from "@/components/ui/radar-status";

interface SearchSignalProps {
  frequency: Frequency;
  mode: ModeOption;
  tone: ToneOption;
  phase: SearchPhase;
  collisionWindow?: boolean;
  connectionStep?: string;
  queueStartedAt: number | null;
  onCancel: () => void;
}

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${`${secs}`.padStart(2, "0")}`;
}

export function SearchSignal({
  frequency,
  mode,
  tone,
  phase,
  collisionWindow = false,
  connectionStep,
  queueStartedAt,
  onCancel
}: SearchSignalProps) {
  const m = useFutureCopy();
  const { enabled: futureMode } = useFutureMode();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!queueStartedAt) {
      setElapsed(0);
      return;
    }

    const tick = () => setElapsed(Math.floor((Date.now() - queueStartedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [queueStartedAt]);

  const modeLabel = m.modeOptions.find((option) => option.value === mode)?.label ?? mode;
  const toneLabel = m.toneOptions.find((option) => option.value === tone)?.label ?? tone;
  const frequencyLabel = getFrequencyDisplayLabel(frequency, m);

  const title = phase === "queued" ? m.search.titleQueued : m.search.titleConnecting;
  const subtitle = connectionStep ?? m.search.subtitle;
  const etaSeconds = predictLinkEtaSeconds(elapsed, phase);
  const handshakeProgress = Math.min(1, elapsed / Math.max(etaSeconds, 1));
  const synapticPreview = futureMode ? computeSynapticScore(frequency, mode, tone) : null;
  const branchField = futureMode ? computeBranchProbability(frequency, elapsed) : null;
  const meshScan = useMemo(() => computeMeshScan(frequency, elapsed), [elapsed, frequency]);

  return (
    <div className="signal-panel w-full max-w-lg rounded-[28px] p-8 text-center sm:p-10">
      <div className="mx-auto mb-6 flex justify-center">
        {futureMode ? <NeuralHandshake progress={handshakeProgress} /> : <RadarStatus />}
      </div>

      <h2 className={`display-font text-2xl sm:text-3xl ${futureMode ? "hologram-text" : "text-white"}`}>{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/58">{subtitle}</p>
      {!futureMode ? <p className="mx-auto mt-2 max-w-sm text-xs text-white/38">{m.search.privacyNote}</p> : null}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            futureMode
              ? "border-[var(--cyan)]/25 bg-[var(--cyan)]/8 text-[var(--cyan)]"
              : "border-cyan-300/20 bg-cyan-300/8 text-cyan-50/90"
          }`}
        >
          {frequency.kind === "daily" ? `${m.frequency.frequencyLabel} #${frequency.number}` : frequencyLabel}
        </span>
        {futureMode ? (
          <>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">{modeLabel}</span>
            <span
              className={`rounded-full border px-3 py-1 text-xs text-white/75 ${
                futureMode ? "border-[var(--purple)]/25 bg-[var(--purple)]/8" : "border-violet-400/20 bg-violet-500/8"
              }`}
            >
              {toneLabel}
            </span>
          </>
        ) : null}
        {queueStartedAt ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
            {formatMessage(m.search.elapsed, { time: formatElapsed(elapsed) })}
          </span>
        ) : null}
        {futureMode ? (
          <span className="rounded-full border border-[var(--gold)]/25 bg-[var(--gold)]/10 px-3 py-1 text-xs text-[var(--gold)]">
            {formatMessage(m.future.search.predictedEta, { seconds: etaSeconds })}
          </span>
        ) : null}
        {futureMode && synapticPreview ? (
          <span className="rounded-full border border-[var(--purple)]/25 bg-[var(--purple)]/10 px-3 py-1 text-xs text-[var(--purple)]">
            {synapticPreview}%
          </span>
        ) : null}
        {collisionWindow ? (
          <span
            className={`rounded-full border px-3 py-1 text-xs ${
              futureMode
                ? "border-[var(--gold)]/30 bg-[var(--gold)]/12 text-[var(--gold)]"
                : "border-violet-400/25 bg-violet-500/12 text-violet-50/90"
            }`}
          >
            {m.search.collisionBadge}
          </span>
        ) : null}
      </div>

      {futureMode ? (
        <MeshNodeScanner
          scan={meshScan}
          title={m.search.meshTitle}
          footer={m.search.meshFooter}
          synapticScore={synapticPreview}
        />
      ) : null}

      {futureMode && branchField ? (
        <MultiverseBranches field={branchField} collapseLabel={m.future.consciousness.multiverse} />
      ) : null}

      <button
        type="button"
        onClick={onCancel}
        className="mt-10 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/75 transition hover:border-cyan-300/20 hover:text-cyan-100"
      >
        {m.search.cancel}
      </button>
    </div>
  );
}
