import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/security/csp";

const base = { nonce: "abc123", isDev: false };

describe("buildCsp", () => {
  it("ships the strictest policy when no optional service is configured", () => {
    const csp = buildCsp(base);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic' 'wasm-unsafe-eval'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("huggingface");
  });

  it("keeps scripts nonce-gated even though styles allow inline CSS", () => {
    const csp = buildCsp(base);
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "));
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(csp.split("; ").find((d) => d.startsWith("style-src "))).toBe("style-src 'self' 'unsafe-inline'");
  });

  it("adds Supabase origins to connect-src (https + wss) and img-src", () => {
    const csp = buildCsp({ ...base, supabaseUrl: "https://abc.supabase.co/" });
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(csp).toContain("img-src 'self' blob: data: https://abc.supabase.co");
  });

  it("adds Turnstile to script, connect, and frame sources when enabled", () => {
    const csp = buildCsp({ ...base, turnstileEnabled: true });
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).toMatch(/script-src [^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/challenges\.cloudflare\.com/);
  });

  it("adds model hosts only when browser AI is enabled", () => {
    const csp = buildCsp({ ...base, browserAiEnabled: true });
    expect(csp).toMatch(/connect-src [^;]*https:\/\/huggingface\.co/);
  });

  it("ignores malformed service URLs instead of widening the policy", () => {
    const csp = buildCsp({ ...base, umamiSrc: "not a url" });
    expect(csp).toContain("connect-src 'self';");
  });

  it("relaxes only what development needs", () => {
    const csp = buildCsp({ ...base, isDev: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws://localhost:*");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});
