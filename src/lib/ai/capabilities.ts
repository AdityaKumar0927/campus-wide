/**
 * Whether this device should run models in the browser (PLAN.md Phase 6). Pure so it can be unit
 * tested; readAiEnv() gathers the inputs from the browser. Every caller treats "no" as a no-op.
 */
export interface AiEnv {
  /** NEXT_PUBLIC_BROWSER_AI=1 on this deployment. */
  enabled: boolean;
  webgpu: boolean;
  saveData: boolean;
  effectiveType?: string;
  metered?: boolean;
  /** The member switched browser AI off (localStorage "cw:browser-ai" = "off"). */
  optOut: boolean;
}

export function canRunBrowserModels(e: AiEnv): boolean {
  if (!e.enabled || e.optOut || e.saveData || e.metered) return false;
  if (e.effectiveType && e.effectiveType !== "4g") return false;
  return true;
}

export function readAiEnv(): AiEnv {
  if (typeof navigator === "undefined") return { enabled: false, webgpu: false, saveData: false, optOut: true };
  const nav = navigator as Navigator & { gpu?: unknown; connection?: { saveData?: boolean; effectiveType?: string; metered?: boolean } };
  let optOut = false;
  try {
    optOut = localStorage.getItem("cw:browser-ai") === "off";
  } catch {
    optOut = false;
  }
  return {
    enabled: process.env.NEXT_PUBLIC_BROWSER_AI === "1",
    webgpu: Boolean(nav.gpu),
    saveData: Boolean(nav.connection?.saveData),
    effectiveType: nav.connection?.effectiveType,
    metered: nav.connection?.metered,
    optOut,
  };
}

/** Chrome's built-in Prompt API (Chrome 138+ desktop): summaries only, never required. */
export async function promptApiAvailable(): Promise<boolean> {
  if (typeof self === "undefined") return false;
  const lm = (self as unknown as { LanguageModel?: { availability?: () => Promise<string> } }).LanguageModel;
  if (!lm?.availability) return false;
  try {
    const a = await lm.availability();
    return a === "available" || a === "readily";
  } catch {
    return false;
  }
}
