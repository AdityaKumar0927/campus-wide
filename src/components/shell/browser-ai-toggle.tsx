"use client";

import { useSyncExternalStore } from "react";
import { setBrowserAi } from "@/lib/ai/client";

const EVENT = "cw:browser-ai";

function readPreference(): boolean {
  try {
    return localStorage.getItem("cw:browser-ai") !== "off";
  } catch {
    return true;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

/** Settings switch for on-device models. Off means no downloads and no nudges; nothing else changes. */
export function BrowserAiToggle({ enabled }: { enabled: boolean }) {
  const on = useSyncExternalStore(subscribe, readPreference, () => true);
  if (!enabled) return <p className="text-sm text-muted-foreground">Browser models are switched off on this deployment.</p>;
  return (
    <label className="flex items-start gap-3 rounded-md border border-rule bg-card p-3 text-sm">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          setBrowserAi(e.target.checked);
          window.dispatchEvent(new Event(EVENT));
        }}
        className="mt-1 size-4 accent-primary"
      />
      <span>
        <span className="font-medium">Run small models in my browser.</span> Duplicate-question suggestions and the harsh-tone nudge run in this browser only; models (about 25 to 70 MB) download once on Wi-Fi and never on a metered or data-saver connection.
      </span>
    </label>
  );
}
