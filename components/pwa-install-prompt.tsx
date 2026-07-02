"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";

export function PWAInstallPrompt() {
  const { m } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs rounded-2xl border border-white/10 bg-[#0a0f17] p-4 shadow-xl">
      <div className="text-sm font-medium text-white">{m.experience.pwa.title}</div>
      <div className="mt-1 text-xs text-white/60">{m.experience.pwa.body}</div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-white/60"
        >
          {m.experience.pwa.dismiss}
        </button>
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="flex-1 rounded-xl bg-cyan-400/10 py-2 text-xs text-cyan-300"
        >
          {m.experience.pwa.install}
        </button>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
