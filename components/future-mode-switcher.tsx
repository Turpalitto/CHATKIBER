"use client";

import { useFutureMode } from "@/components/future-mode-provider";
import { useI18n } from "@/components/locale-provider";

export function FutureModeSwitcher() {
  const { enabled, toggle } = useFutureMode();
  const { m } = useI18n();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] transition ${
        enabled
          ? "era-badge shadow-[0_0_16px_rgba(255,210,138,0.18)]"
          : "border border-white/10 bg-white/5 text-white/45 hover:text-white/70"
      }`}
      aria-pressed={enabled}
      title={enabled ? m.future.shell.eraToggleOff : m.future.shell.eraToggleOn}
    >
      {enabled ? m.future.shell.eraBadge : m.future.shell.eraToggleOff}
    </button>
  );
}
