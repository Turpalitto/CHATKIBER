"use client";

import { useMemo } from "react";
import { useFutureMode } from "@/components/future-mode-provider";
import { useI18n } from "@/components/locale-provider";
import { Messages } from "@/lib/i18n/types";

export function useFutureCopy(): Messages {
  const { m } = useI18n();
  const { enabled } = useFutureMode();

  return useMemo(() => {
    if (!enabled) {
      return m;
    }

    const f = m.future;
    return {
      ...m,
      shell: { ...m.shell, ...f.shell },
      landing: { ...m.landing, ...f.landing },
      frequency: { ...m.frequency, ...f.frequency },
      search: { ...m.search, ...f.search },
      chat: { ...m.chat, ...f.chat },
      receipt: { ...m.receipt, ...f.receipt },
      system: { ...m.system, ...f.system },
      network: { ...m.network, ...f.network },
      terminal: { ...m.terminal, ...f.terminal },
      connectionSteps: f.connectionSteps,
      future: m.future
    };
  }, [enabled, m]);
}
