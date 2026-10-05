"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      ("standalone" in window.navigator &&
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    setIsStandalone(standalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      const dismissed = window.localStorage.getItem("umuhuza_install_dismissed");
      if (!dismissed) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone || !visible || !deferred) return null;

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-[4.75rem] z-[60] px-3 md:bottom-4 md:left-auto md:right-4 md:w-[360px]">
      <div className="rounded-2xl border border-white/10 bg-[#0b1c2c] p-4 text-white shadow-2xl">
        <p className="text-sm font-bold">Install Umuhuza Online</p>
        <p className="mt-1 text-xs text-white/65">
          Add to your home screen for a full-screen app experience.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="btn flex-1 rounded-xl bg-teal text-sm text-white"
            onClick={async () => {
              await deferred.prompt();
              setVisible(false);
              setDeferred(null);
            }}
          >
            Install
          </button>
          <button
            type="button"
            className="btn rounded-xl border border-white/20 px-4 text-sm text-white/80"
            onClick={() => {
              window.localStorage.setItem("umuhuza_install_dismissed", "1");
              setVisible(false);
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
