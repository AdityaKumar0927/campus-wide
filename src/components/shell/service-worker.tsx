"use client";

import { useEffect } from "react";

/** Registers the worker once the page is idle, so it never competes with the first paint. */
export function ServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // An unregistered worker is not an error worth showing anyone.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
