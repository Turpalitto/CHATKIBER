"use client";

import { useEffect, useState } from "react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("PWA installed");
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs rounded-2xl border border-white/10 bg-[#0a0f17] p-4 shadow-xl">
      <div className="text-sm font-medium text-white">Установить SIGNAL</div>
      <div className="mt-1 text-xs text-white/60">
        Добавь приложение на домашний экран для лучшего опыта
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setShowPrompt(false)}
          className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-white/60"
        >
          Не сейчас
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 rounded-xl bg-cyan-400/10 py-2 text-xs text-cyan-300"
        >
          Установить
        </button>
      </div>
    </div>
  );
}