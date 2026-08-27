import { describe, expect, it } from "vitest";
import { encryptSessionCookie, decodeSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session-token";

describe("session-token", () => {
  it("exposes the cookie name used across the app", () => {
    expect(SESSION_COOKIE_NAME).toBe("afiliai_session");
  });

  it("round-trips a payload through encrypt/decode", async () => {
    const token = await encryptSessionCookie({ sessionId: "sess-123" }, new Date(Date.now() + 60_000));
    const decoded = await decodeSessionCookie(token);
    expect(decoded).toEqual({ sessionId: "sess-123" });
  });

  it("returns null for an expired token", async () => {
    const token = await encryptSessionCookie({ sessionId: "sess-123" }, new Date(Date.now() - 1000));
    const decoded = await decodeSessionCookie(token);
    expect(decoded).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await encryptSessionCookie({ sessionId: "sess-123" }, new Date(Date.now() + 60_000));
    const tampered = token.slice(0, -2) + (token.at(-2) === "a" ? "b" : "a") + token.at(-1);
    const decoded = await decodeSessionCookie(tampered);
    expect(decoded).toBeNull();
  });

  it("returns null for undefined/empty input", async () => {
    expect(await decodeSessionCookie(undefined)).toBeNull();
    expect(await decodeSessionCookie("")).toBeNull();
  });
});
