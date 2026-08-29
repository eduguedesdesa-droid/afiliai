import { describe, expect, it } from "vitest";
import { whatsappUrl, instagramProfileUrl } from "@/lib/contact-links";

describe("whatsappUrl", () => {
  it("returns null for empty/nullish input", () => {
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl(undefined)).toBeNull();
    expect(whatsappUrl("")).toBeNull();
  });

  it("returns null for something too short to be a phone number", () => {
    expect(whatsappUrl("123")).toBeNull();
  });

  it("assumes Brazil (55) for an 11-digit number without country code", () => {
    expect(whatsappUrl("11999998888")).toBe("https://wa.me/5511999998888");
  });

  it("strips formatting characters before normalizing", () => {
    expect(whatsappUrl("(11) 99999-8888")).toBe("https://wa.me/5511999998888");
  });

  it("keeps a number that already has a country code (more than 11 digits)", () => {
    expect(whatsappUrl("5511999998888")).toBe("https://wa.me/5511999998888");
  });
});

describe("instagramProfileUrl", () => {
  it("returns null for empty/nullish input", () => {
    expect(instagramProfileUrl(null)).toBeNull();
    expect(instagramProfileUrl(undefined)).toBeNull();
    expect(instagramProfileUrl("   ")).toBeNull();
  });

  it("builds a profile URL from a bare handle", () => {
    expect(instagramProfileUrl("joaoafiliado")).toBe("https://instagram.com/joaoafiliado");
  });

  it("strips a leading @", () => {
    expect(instagramProfileUrl("@joaoafiliado")).toBe("https://instagram.com/joaoafiliado");
  });

  it("returns an already-complete URL as-is", () => {
    expect(instagramProfileUrl("https://instagram.com/joaoafiliado")).toBe("https://instagram.com/joaoafiliado");
  });

  it("normalizes a bare instagram.com/handle (no protocol)", () => {
    expect(instagramProfileUrl("instagram.com/joaoafiliado")).toBe("https://instagram.com/joaoafiliado");
  });
});
