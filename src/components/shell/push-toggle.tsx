"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { removePushSubscription, savePushSubscription } from "@/lib/push/actions";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type Capability = "server" | "unsupported" | "blocked" | "ready";

/** Read once per render rather than stored in state, so nothing is set synchronously inside an effect. */
function readCapability(): Capability {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return "ready";
}

const subscribe = (onChange: () => void) => {
  window.addEventListener("focus", onChange);
  return () => window.removeEventListener("focus", onChange);
};

/**
 * Push is opt-in, asked for only when the member taps the button (never on load), and it always has
 * the weekly digest as the fallback. Without VAPID keys the section says so and does nothing.
 */
export function PushToggle({ publicKey }: { publicKey: string }) {
  const capability = useSyncExternalStore(subscribe, readCapability, () => "server" as const);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!publicKey || capability !== "ready") return;
    let alive = true;
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (alive) setSubscribed(Boolean(sub));
      })
      .catch(() => {
        if (alive) setSubscribed(false);
      });
    return () => {
      alive = false;
    };
  }, [publicKey, capability]);

  if (!publicKey) return <p className="text-sm text-muted-foreground">Push notifications are not configured on this deployment. The weekly digest still works.</p>;
  if (capability === "unsupported") return <p className="text-sm text-muted-foreground">This browser cannot do push notifications. Install the app first, or rely on the weekly digest.</p>;
  if (capability === "blocked") return <p className="text-sm text-muted-foreground">Notifications are blocked for this site in your browser settings. Nothing is sent.</p>;
  if (capability === "server" || subscribed === null) return <p className="text-sm text-muted-foreground">Checking this device…</p>;

  async function toggle() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await removePushSubscription(existing.endpoint);
        await existing.unsubscribe();
        setSubscribed(false);
        return;
      }
      if ((await Notification.requestPermission()) !== "granted") {
        setSubscribed(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const saved = json.endpoint && json.keys?.p256dh && json.keys.auth ? await savePushSubscription({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }) : false;
      if (!saved) await sub.unsubscribe();
      setSubscribed(saved);
    } catch {
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" size="sm" variant={subscribed ? "outline" : "default"} aria-pressed={subscribed} disabled={busy} onClick={toggle}>
        {busy ? "Working…" : subscribed ? "Turn off notifications on this device" : "Notify me on this device"}
      </Button>
      <span className="text-xs text-muted-foreground">Answers, thank-yous, and relay messages only. Never marketing.</span>
    </div>
  );
}
