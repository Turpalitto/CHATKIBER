"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useFutureMode } from "@/components/future-mode-provider";

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${4 + index * 5.2}%`,
  duration: 10 + (index % 5) * 2,
  delay: index * 0.7
}));

export function AtmosphereBackground() {
  const reduceMotion = useReducedMotion();
  const { enabled: futureMode } = useFutureMode();
  const accent = futureMode ? "via-[var(--gold)]/50" : "via-cyan-300/60";
  const ringA = futureMode ? "border-[var(--cyan)]/12" : "border-cyan-300/10";
  const ringB = futureMode ? "border-[var(--purple)]/12" : "border-violet-400/10";
  const lineA = futureMode ? "via-[var(--cyan)]/60" : "via-cyan-300/70";
  const lineB = futureMode ? "via-[var(--gold)]/55" : "via-violet-400/70";
  const glowTop = futureMode ? "from-[var(--cyan)]/12" : "from-cyan-300/10";
  const glowBottom = futureMode ? "bg-[var(--purple)]/12" : "bg-violet-500/10";

  if (reduceMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 noise-layer opacity-40" />
        <div className="absolute inset-0 grid-overlay opacity-20" />
        <div className={`absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringA}`} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 noise-layer" />
      <div className="absolute inset-0 scan-lines" />
      <div className="absolute inset-0 grid-overlay opacity-30" />

      {futureMode ? (
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, transparent, rgba(201,160,255,0.08), transparent, rgba(255,210,138,0.06), transparent)"
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
        />
      ) : null}

      <motion.div
        className={`absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringA}`}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.25, 0.4, 0.25] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringB}`}
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.32, 0.15] }}
        transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
      />

      <div className="absolute inset-0">
        {PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className={`absolute bottom-[-10%] h-14 w-px bg-gradient-to-t from-transparent ${accent} to-transparent`}
            style={{
              left: particle.left,
              animation: `floatParticle ${particle.duration}s linear ${particle.delay}s infinite`
            }}
          />
        ))}
      </div>

      <motion.div
        className={`absolute left-[8%] top-[18%] h-px w-[36%] bg-gradient-to-r from-transparent ${lineA} to-transparent`}
        animate={{ x: [-20, 40, -20], opacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute right-[10%] top-[72%] h-px w-[28%] bg-gradient-to-r from-transparent ${lineB} to-transparent`}
        animate={{ x: [20, -30, 20], opacity: [0.18, 0.6, 0.18] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className={`absolute left-1/2 top-0 h-40 w-[1px] -translate-x-1/2 bg-gradient-to-b from-[var(--cyan)]/0 ${futureMode ? "via-[var(--gold)]/40" : "via-cyan-300/50"} to-transparent`}
        animate={{ opacity: [0.15, 0.55, 0.15], scaleY: [0.8, 1.1, 0.8] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-x-[18%] top-[12%] h-[1px] shimmer-line animate-shimmer opacity-25" />
      <div className={`absolute inset-x-0 top-0 h-44 bg-gradient-to-b ${glowTop} via-transparent to-transparent blur-3xl`} />
      <div className={`absolute bottom-0 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full ${glowBottom} blur-3xl`} />
    </div>
  );
}
