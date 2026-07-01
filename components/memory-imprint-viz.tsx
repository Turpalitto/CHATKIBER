"use client";

import { motion } from "framer-motion";
import { MemoryImprint } from "@/lib/types";
import { LatticeSealGrid } from "@/components/lattice-seal-grid";
import { createLatticeSealSync } from "@/lib/consciousness/lattice-seal";

interface MemoryImprintVizProps {
  imprint: MemoryImprint;
  labels: {
    title: string;
    imprint: string;
    diffusion: string;
    dominant: string;
    axes: Record<MemoryImprint["dominantAxis"], string>;
    trajectory: Record<MemoryImprint["trajectory"], string>;
    lattice: string;
    noovector: string;
    predictions: Record<string, string>;
    echo: string;
  };
}

export function MemoryImprintViz({ imprint, labels }: MemoryImprintVizProps) {
  const seal = createLatticeSealSync(imprint.latticeCommitment);
  const prediction = labels.predictions[imprint.prediction] ?? imprint.prediction;

  return (
    <div className="mt-6 space-y-4 text-left">
      <p className="text-center text-[10px] uppercase tracking-[0.32em] text-[var(--purple)]/70">{labels.title}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--cyan)]/15 bg-[var(--cyan)]/5 p-3">
          <p className="text-[10px] text-white/40">{labels.imprint}</p>
          <p className="display-font mt-1 text-xl text-[var(--cyan)]">{imprint.imprintStrength}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/40">{labels.diffusion}</p>
          <p className="display-font mt-1 text-xl text-white/75">{imprint.diffusionRate}%</p>
        </div>
      </div>

      <motion.div
        className="relative overflow-hidden rounded-2xl border border-[var(--purple)]/18 bg-black/25 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">{labels.lattice}</p>
        <p className="mt-1 font-mono text-[11px] text-[var(--cyan)]/85">{imprint.latticeCommitment}</p>
        <div className="mt-3 flex justify-center">
          <LatticeSealGrid seal={seal} compact />
        </div>
      </motion.div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-6 text-white/58">
        <p>
          {labels.dominant}: <span className="text-[var(--gold)]">{labels.axes[imprint.dominantAxis]}</span>
        </p>
        <p className="mt-1">
          {labels.trajectory[imprint.trajectory]} · {labels.noovector} {imprint.noovector.join(" / ")}
        </p>
        <p className="mt-2 text-white/72">{prediction}</p>
        {imprint.echoMoments > 0 ? (
          <p className="mt-1 text-[var(--gold)]/80">{labels.echo.replace("{count}", String(imprint.echoMoments))}</p>
        ) : null}
      </div>
    </div>
  );
}
