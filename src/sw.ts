/// <reference lib="webworker" />
import { NetworkFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";

/**
 * Service worker (ARCHITECTURE.md §12). Built by scripts/build-sw.mjs with esbuild, not by a bundler
 * plugin, so the precache list stays small and explicit: the offline page and the app icon. Everything
 * else is fetched from the network first, with the offline page as the fallback for navigations.
 */
declare const self: ServiceWorkerGlobalScope;

const OFFLINE_URL = "/offline";
const VERSION = "cw-v1";

const serwist = new Serwist({
  precacheEntries: [
    { url: OFFLINE_URL, revision: VERSION },
    { url: "/icon.svg", revision: VERSION },
    { url: "/manifest.webmanifest", revision: VERSION },
  ],
  precacheOptions: { cleanupOutdatedCaches: true, concurrency: 4 },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Pages: fresh when online, the offline notice when not. Never cache a signed-in page for long.
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({ cacheName: "pages", networkTimeoutSeconds: 4, plugins: [] }),
    },
    {
      matcher: ({ request }) => request.destination === "style" || request.destination === "font" || request.destination === "script",
      handler: new StaleWhileRevalidate({ cacheName: "assets" }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/_next/image") || url.pathname.startsWith("/storage/v1/object/public/"),
      handler: new StaleWhileRevalidate({ cacheName: "images" }),
    },
    {
      // Anything with a session or a mutation goes straight to the network.
      matcher: ({ url, request }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || request.method !== "GET",
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [{ url: OFFLINE_URL, matcher: ({ request }) => request.mode === "navigate" }],
  },
});

serwist.addEventListeners();

/** Web Push: the payload carries only what the inbox row already shows. */
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; href?: string; tag?: string } = {};
  try {
    payload = event.data.json() as typeof payload;
  } catch {
    payload = { title: "Campus Wide", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Campus Wide", {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/maskable-192.png",
      tag: payload.tag ?? "campus-wide",
      data: { href: payload.href ?? "/inbox" },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const href = (event.notification.data as { href?: string } | undefined)?.href ?? "/inbox";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          void client.navigate(href);
          return client.focus();
        }
      }
      return self.clients.openWindow(href);
    }),
  );
});
