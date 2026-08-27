import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, __resetRateLimitForTests } from "@/lib/rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
  __resetRateLimitForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows requests up to the limit within the window", () => {
    const opts = { limit: 3, windowSeconds: 60 };
    expect(checkRateLimit("k", opts).allowed).toBe(true);
    expect(checkRateLimit("k", opts).allowed).toBe(true);
    expect(checkRateLimit("k", opts).allowed).toBe(true);
  });

  it("rejects the request that exceeds the limit within the window", () => {
    const opts = { limit: 2, windowSeconds: 60 };
    checkRateLimit("k", opts);
    checkRateLimit("k", opts);
    const result = checkRateLimit("k", opts);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const opts = { limit: 1, windowSeconds: 60 };
    expect(checkRateLimit("a", opts).allowed).toBe(true);
    expect(checkRateLimit("b", opts).allowed).toBe(true);
    expect(checkRateLimit("a", opts).allowed).toBe(false);
  });

  it("resets the count once the window elapses", () => {
    const opts = { limit: 1, windowSeconds: 60 };
    expect(checkRateLimit("k", opts).allowed).toBe(true);
    expect(checkRateLimit("k", opts).allowed).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(checkRateLimit("k", opts).allowed).toBe(true);
  });

  it("reports a decreasing retryAfterSeconds as the window approaches expiry", () => {
    const opts = { limit: 1, windowSeconds: 60 };
    checkRateLimit("k", opts);
    const first = checkRateLimit("k", opts);
    expect(first.retryAfterSeconds).toBe(60);

    vi.advanceTimersByTime(30_000);

    const second = checkRateLimit("k", opts);
    expect(second.retryAfterSeconds).toBe(30);
  });
});

describe("E2E_TESTING bypass", () => {
  const originalValue = process.env.E2E_TESTING;

  afterEach(() => {
    if (originalValue === undefined) delete process.env.E2E_TESTING;
    else process.env.E2E_TESTING = originalValue;
    vi.resetModules();
  });

  it("never blocks when E2E_TESTING=1 (only set by the E2E test server)", async () => {
    process.env.E2E_TESTING = "1";
    vi.resetModules();
    const { checkRateLimit: checkRateLimitWithE2eFlag } = await import("@/lib/rate-limit");

    const opts = { limit: 1, windowSeconds: 60 };
    checkRateLimitWithE2eFlag("k", opts);
    const result = checkRateLimitWithE2eFlag("k", opts); // seria bloqueado sem o bypass

    expect(result.allowed).toBe(true);
  });
});
