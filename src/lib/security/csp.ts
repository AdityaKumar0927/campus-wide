/**
 * Content-Security-Policy builder.
 *
 * Pure function so it can be unit-tested. Hosts for optional services are added only when the
 * corresponding public env var is configured, so a fresh checkout ships the strictest policy.
 * See ARCHITECTURE.md §10 for the rationale behind every directive.
 */

export interface CspOptions {
  nonce: string;
  isDev: boolean;
  supabaseUrl?: string;
  umamiSrc?: string;
  turnstileEnabled?: boolean;
  /** Phase 6: allow in-browser model downloads (Transformers.js). */
  browserAiEnabled?: boolean;
}

const TURNSTILE = "https://challenges.cloudflare.com";
const MODEL_HOSTS = ["https://huggingface.co", "https://*.huggingface.co", "https://*.hf.co"];

function origin(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export function buildCsp(o: CspOptions): string {
  const supabase = origin(o.supabaseUrl);
  const supabaseWs = supabase?.replace(/^https:/, "wss:");
  const umami = origin(o.umamiSrc);

  const scriptSrc = ["'self'", `'nonce-${o.nonce}'`, "'strict-dynamic'", "'wasm-unsafe-eval'"];
  if (o.isDev) scriptSrc.push("'unsafe-eval'");
  if (o.turnstileEnabled) scriptSrc.push(TURNSTILE);
  if (umami) scriptSrc.push(umami);

  const connectSrc = ["'self'"];
  if (o.isDev) connectSrc.push("ws://localhost:*", "ws://127.0.0.1:*");
  if (supabase) connectSrc.push(supabase, supabaseWs!);
  if (umami) connectSrc.push(umami);
  if (o.turnstileEnabled) connectSrc.push(TURNSTILE);
  if (o.browserAiEnabled) connectSrc.push(...MODEL_HOSTS);

  const imgSrc = ["'self'", "blob:", "data:"];
  if (supabase) imgSrc.push(supabase);

  const frameSrc = o.turnstileEnabled ? [TURNSTILE] : ["'none'"];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    // Styles: UI libraries (Sonner, Base UI positioning) inject <style> elements and style attributes at
    // runtime without nonce support, and a nonce in style-src would make 'unsafe-inline' ignored. Inline
    // CSS is a low-severity vector; scripts remain strictly nonce-gated, which is what stops XSS.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": imgSrc,
    "font-src": ["'self'"],
    "connect-src": connectSrc,
    "worker-src": ["'self'", "blob:"],
    "frame-src": frameSrc,
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  if (!o.isDev) directives["upgrade-insecure-requests"] = [];

  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

export function cspFromEnv(nonce: string): string {
  return buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    umamiSrc: process.env.NEXT_PUBLIC_UMAMI_SRC,
    turnstileEnabled: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    browserAiEnabled: process.env.NEXT_PUBLIC_BROWSER_AI === "1",
  });
}
