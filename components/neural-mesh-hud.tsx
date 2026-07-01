"use client";

import { motion } from "framer-motion";
import { ConsciousnessField } from "@/lib/consciousness/types";
import { formatMessage } from "@/lib/i18n";

interface NeuralMeshHudProps {
  field: ConsciousnessField;
  labels: {
    title: string;
    composite: string;
    trajectory: Record<ConsciousnessField["trajectory"], string>;
    axes: Record<keyof ConsciousnessField["axes"], string>;
    noovector: string;
    predictions: Record<string, string>;
    echo: string;
  };
}

function AxisBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-white/45">
        <span>{label}</span>
        <span className="text-white/70">{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--cyan)] via-[var(--gold)] to-[var(--purple)]"
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function NeuralMeshHud({ field, labels }: NeuralMeshHudProps) {
  const prediction = labels.predictions[field.prediction] ?? field.prediction;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--purple)]/18 bg-black/30 p-3 backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--cyan)]/70">{labels.title}</p>
        <span className="rounded-full border border-[var(--gold)]/25 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] text-[var(--gold)]">
          {labels.trajectory[field.trajectory]}
        </span>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] text-white/40">{labels.composite}</p>
          <p className="display-font text-2xl hologram-text">{field.composite}%</p>
        </div>
        <div className="text-right text-[10px] text-white/45">
          <p>{labels.noovector}</p>
          <p className="mt-1 font-mono text-[var(--cyan)]/80">
            {field.noovector[0]} · {field.noovector[1]} · {field.noovector[2]}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {(Object.keys(field.axes) as Array<keyof ConsciousnessField["axes"]>).map((axis) => (
          <AxisBar key={axis} label={labels.axes[axis]} value={field.axes[axis]} />
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-white/55">{prediction}</p>
      {field.echoMoments > 0 ? (
        <p className="mt-1 text-[10px] text-[var(--gold)]/80">
          {formatMessage(labels.echo, { count: field.echoMoments })}
        </p>
      ) : null}
    </motion.div>
  );
}
