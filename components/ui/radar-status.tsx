interface RadarStatusProps {
  size?: "md" | "lg";
}

export function RadarStatus({ size = "lg" }: RadarStatusProps) {
  const box = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const dot = size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <div className={`relative ${box} shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/5`}>
      <span className="absolute inset-0 rounded-full border border-cyan-300/25" style={{ animation: "radarPulse 2.4s linear infinite" }} />
      <span
        className={`absolute left-1/2 top-1/2 ${dot} -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(91,247,255,0.85)]`}
      />
    </div>
  );
}
