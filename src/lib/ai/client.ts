"use client";

import { canRunBrowserModels, readAiEnv } from "./capabilities";

/**
 * Main-thread door to the model worker. Lazy: the worker (and the first model download) starts on
 * the first call, never on page load. Every call resolves to null when the device should not run
 * models, when the worker fails, or when it takes too long; callers render nothing in that case.
 */
type Pending = { resolve: (v: unknown) => void; timer: ReturnType<typeof setTimeout> };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === "undefined") return null;
  try {
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; vector?: number[]; scores?: { label: string; score: number }[] }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      clearTimeout(p.timer);
      p.resolve(e.data.ok ? e.data : null);
    };
    worker.onerror = () => {
      for (const [id, p] of pending) {
        clearTimeout(p.timer);
        p.resolve(null);
        pending.delete(id);
      }
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

function ask(kind: "embed" | "toxicity", text: string, timeoutMs: number): Promise<unknown> {
  const env = readAiEnv();
  if (!canRunBrowserModels(env)) return Promise.resolve(null);
  const w = getWorker();
  if (!w) return Promise.resolve(null);
  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, timeoutMs);
    pending.set(id, { resolve, timer });
    w.postMessage({ id, kind, text, device: env.webgpu ? "webgpu" : "wasm" });
  });
}

export async function embed(text: string): Promise<number[] | null> {
  const r = (await ask("embed", text.slice(0, 1000), 90_000)) as { vector?: number[] } | null;
  return r?.vector && r.vector.length === 384 ? r.vector : null;
}

export interface ToxicityVerdict {
  /** Highest score across the toxic labels, 0 to 1. */
  score: number;
  label: string;
}

export async function toxicity(text: string): Promise<ToxicityVerdict | null> {
  const r = (await ask("toxicity", text.slice(0, 1000), 90_000)) as { scores?: { label: string; score: number }[] } | null;
  if (!r?.scores?.length) return null;
  const top = r.scores.reduce((a, b) => (b.score > a.score ? b : a));
  return { score: top.score, label: top.label };
}

/** The member can switch browser models off (Settings); the worker is dropped at once. */
export function setBrowserAi(on: boolean) {
  try {
    localStorage.setItem("cw:browser-ai", on ? "on" : "off");
  } catch {
    // storage unavailable: nothing to remember
  }
  if (!on && worker) {
    worker.terminate();
    worker = null;
  }
}
