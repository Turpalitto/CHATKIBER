"use client";

import { motion } from "framer-motion";
import { BranchProbability } from "@/lib/consciousness/types";

interface MultiverseBranchesProps {
  field: BranchProbability;
  collapseLabel: string;
}

export function MultiverseBranches({ field, collapseLabel }: MultiverseBranchesProps) {
  return (
    <div className="mt-5 rounded-2xl border border-[var(--purple)]/15 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">{collapseLabel}</p>
      <div className="mt-3 space-y-2">
        {field.branches.map((branch, index) => {
          const active = branch.id === field.collapseTarget;
          return (
            <div key={branch.id} className="flex items-center gap-2">
              <span className={`w-14 text-[10px] uppercase tracking-[0.18em] ${active ? "text-[var(--gold)]" : "text-white/35"}`}>
                {branch.label}
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className={`h-full ${active ? "bg-gradient-to-r from-[var(--gold)] to-[var(--cyan)]" : "bg-[var(--purple)]/45"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${branch.weight}%` }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                />
              </div>
              <span className="w-8 text-right text-[10px] text-white/45">{branch.weight}%</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-[var(--cyan)]/65">
        {collapseLabel}: {field.coherence}% coherence
      </p>
    </div>
  );
}
