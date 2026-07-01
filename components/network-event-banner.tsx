"use client";

import { useFutureCopy } from "@/hooks/useFutureCopy";
import { NetworkEvent } from "@/lib/types";

interface NetworkEventBannerProps {
  event: NetworkEvent;
}

export function NetworkEventBanner({ event }: NetworkEventBannerProps) {
  const m = useFutureCopy();
  const title = event.kind === "blackout" ? m.network.blackout : m.network.collision;

  return (
    <div
      className={`mb-2 w-full rounded-2xl border px-3 py-2 text-[11px] leading-5 ${
        event.kind === "blackout"
          ? "border-orange-300/20 bg-orange-300/10 text-orange-50/90"
          : "border-violet-400/20 bg-violet-500/10 text-violet-50/90"
      }`}
    >
      <span className="font-medium">{title}</span>
      <span className="text-white/55"> — {event.body}</span>
    </div>
  );
}
