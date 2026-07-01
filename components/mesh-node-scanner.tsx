"use client";

import { motion } from "framer-motion";
import { MeshScanState } from "@/lib/mesh-nodes";

interface MeshNodeScannerProps {
  scan: MeshScanState;
  title: string;
  footer: string;
  synapticScore?: number | null;
}

export function MeshNodeScanner({ scan, title, footer, synapticScore }: MeshNodeScannerProps) {
  return (
    <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4 text-left">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/42">{title}</p>
        {synapticScore ? (
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <motion.circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="url(#scanRing)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={150.8}
                animate={{ strokeDashoffset: 150.8 - (scan.scanProgress / 100) * 150.8 }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient id="scanRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--gold)" />
                  <stop offset="100%" stopColor="var(--cyan)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xs font-medium text-[var(--gold)]">{synapticScore}%</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {scan.nodes.map((node) => (
          <div key={node.id} className="flex items-center gap-3">
            <span
              className={`w-12 text-[10px] font-medium uppercase tracking-[0.2em] ${
                node.active ? "text-[var(--gold)]" : "text-white/35"
              }`}
            >
              {node.label}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className={`h-full ${node.active ? "bg-gradient-to-r from-[var(--gold)] to-[var(--cyan)]" : "bg-white/20"}`}
                animate={{ width: `${node.progress}%` }}
                transition={{ duration: 0.45 }}
              />
            </div>
            <span className="w-10 text-right text-[10px] text-white/42">{node.count}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-white/48">
        {footer.replace("{count}", scan.totalFound.toLocaleString())}
      </p>
    </div>
  );
}
