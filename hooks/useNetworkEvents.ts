"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { getActiveNetworkEvent } from "@/lib/network-events";
import { NetworkEvent } from "@/lib/types";

function localizeEvent(event: NetworkEvent, copy: { blackout: string; collision: string; bodies: { blackout: string; collision: string } }): NetworkEvent {
  return {
    ...event,
    title: event.kind === "blackout" ? copy.blackout : copy.collision,
    body: event.kind === "blackout" ? copy.bodies.blackout : copy.bodies.collision
  };
}

export function useNetworkEvents() {
  const { m } = useI18n();
  const [event, setEvent] = useState<NetworkEvent | null>(null);

  useEffect(() => {
    const refresh = () => {
      const active = getActiveNetworkEvent();
      setEvent(active ? localizeEvent(active, m.network) : null);
    };
    refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, [m.network]);

  return event;
}
