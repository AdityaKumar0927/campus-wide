"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { PinMark } from "@/components/shell/wordmark";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED = "cw:install-dismissed";
const CHANGED = "cw:install-dismissed-changed";

/** Read during render rather than stored in state, so nothing is set synchronously inside an effect. */
function readEnvironment(): { dismissed: boolean; ios: boolean; installed: boolean } {
  if (typeof navigator === "undefined") return { dismissed: true, ios: false, installed: true };
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(DISMISSED) === "1";
  } catch {
    dismissed = false;
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    dismissed,
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window),
    installed: window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone),
  };
}

const SERVER = { dismissed: true, ios: false, installed: true };
let cached: ReturnType<typeof readEnvironment> | null = null;

/** Cached so the snapshot is referentially stable between renders. */
function snapshot() {
  cached ??= readEnvironment();
  return cached;
}

function subscribe(onChange: () => void) {
  const refresh = () => {
    cached = readEnvironment();
    onChange();
  };
  window.addEventListener(CHANGED, refresh);
  return () => window.removeEventListener(CHANGED, refresh);
}

/**
 * The install invitation (ARCHITECTURE.md §12: install before asking for notification permission).
 * It sits in the page flow at the top of the board, never floating over the content, and disappears
 * for good once dismissed. iOS has no install event, so it gets the Add to Home Screen sentence.
 */
export function InstallPrompt() {
  const env = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  const [installable, setInstallable] = useState(false);
  const deferred = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as InstallEvent;
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // nothing to remember
    }
    window.dispatchEvent(new Event(CHANGED));
  }

  if (env.dismissed || env.installed) return null;
  if (!installable && !env.ios) return null;

  return (
    <aside aria-label="Install Campus Wide" className="notice mb-6 px-4 pt-5 pb-4" style={{ "--stock": "var(--stock-white)" } as React.CSSProperties}>
      <p className="stamp flex items-center gap-2">
        <PinMark className="size-3" /> Keep the board in your pocket
      </p>
      <p className="mt-1 text-sm">
        {env.ios && !installable
          ? "Tap the share button, then Add to Home Screen. It opens full screen and works offline."
          : "Install it and the board opens full screen, works offline, and can tell you when someone answers."}
      </p>
      <div className="mt-3 flex gap-2">
        {installable && (
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              const event = deferred.current;
              if (!event) return dismiss();
              await event.prompt();
              await event.userChoice;
              dismiss();
            }}
          >
            Install
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
          {installable ? "Not now" : "Got it"}
        </Button>
      </div>
    </aside>
  );
}
