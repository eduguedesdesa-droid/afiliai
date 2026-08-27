import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch;
const originalResendKey = process.env.RESEND_API_KEY;
const originalEmailFrom = process.env.EMAIL_FROM;

afterEach(() => {
  global.fetch = originalFetch;
  if (originalResendKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalResendKey;
  if (originalEmailFrom === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = originalEmailFrom;
  vi.resetModules();
});

describe("sendEmail", () => {
  it("does not call fetch and returns sent:false when RESEND_API_KEY is unset (dev mode)", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.resetModules();
    const { sendEmail } = await import("@/lib/email");

    const result = await sendEmail({ to: "a@b.com", subject: "Oi", html: "<p>oi</p>", text: "oi" });

    expect(result).toEqual({ sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the Resend API with the right payload when RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Afiliai <test@afiliai.com>";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.resetModules();
    const { sendEmail } = await import("@/lib/email");

    const result = await sendEmail({ to: "a@b.com", subject: "Oi", html: "<p>oi</p>", text: "oi" });

    expect(result).toEqual({ sent: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ from: "Afiliai <test@afiliai.com>", to: "a@b.com", subject: "Oi" });
  });

  it("returns sent:false (without throwing) when the Resend API responds with an error status", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const fetchMock = vi.fn().mockResolvedValue(new Response("invalid api key", { status: 401 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.resetModules();
    const { sendEmail } = await import("@/lib/email");

    const result = await sendEmail({ to: "a@b.com", subject: "Oi", html: "<p>oi</p>", text: "oi" });

    expect(result).toEqual({ sent: false });
  });

  it("returns sent:false (without throwing) when fetch itself rejects (network error)", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.resetModules();
    const { sendEmail } = await import("@/lib/email");

    const result = await sendEmail({ to: "a@b.com", subject: "Oi", html: "<p>oi</p>", text: "oi" });

    expect(result).toEqual({ sent: false });
  });
});
