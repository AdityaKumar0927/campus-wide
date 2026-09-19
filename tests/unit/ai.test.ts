import { describe, expect, it } from "vitest";
import { canRunBrowserModels } from "@/lib/ai/capabilities";
import { scrubPii } from "@/lib/ai/pii";

describe("canRunBrowserModels", () => {
  const ok = { enabled: true, webgpu: true, saveData: false, effectiveType: "4g", metered: false, optOut: false };
  it("runs on a capable device on a good connection", () => {
    expect(canRunBrowserModels(ok)).toBe(true);
  });
  it("stays off when the deployment has not enabled it", () => {
    expect(canRunBrowserModels({ ...ok, enabled: false })).toBe(false);
  });
  it("respects Save-Data, metered, slow, and opt-out", () => {
    expect(canRunBrowserModels({ ...ok, saveData: true })).toBe(false);
    expect(canRunBrowserModels({ ...ok, metered: true })).toBe(false);
    expect(canRunBrowserModels({ ...ok, effectiveType: "3g" })).toBe(false);
    expect(canRunBrowserModels({ ...ok, optOut: true })).toBe(false);
  });
  it("does not require WebGPU (WASM is the fallback)", () => {
    expect(canRunBrowserModels({ ...ok, webgpu: false })).toBe(true);
  });
});

describe("scrubPii", () => {
  it("removes emails, phones, handles, links, and long numbers", () => {
    const out = scrubPii("Text me at 312-808-6300 or jdoe01@hawk.illinoistech.edu, @jdoe01 https://example.com/x id 20261234");
    expect(out).not.toMatch(/@hawk|312-808|jdoe01|example\.com|20261234/);
    expect(out).toContain("[phone]");
    expect(out).toContain("[email]");
    expect(out).toContain("[handle]");
    expect(out).toContain("[link]");
    expect(out).toContain("[number]");
  });
  it("leaves ordinary text alone", () => {
    expect(scrubPii("Does the 2am shuttle run during reading week?")).toBe("Does the 2am shuttle run during reading week?");
  });
});
