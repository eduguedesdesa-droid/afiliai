import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Loja XYZ")).toBe("loja-xyz");
  });

  it("removes accents/diacritics", () => {
    expect(slugify("Confecções São João")).toBe("confeccoes-sao-joao");
  });

  it("strips characters that aren't letters/numbers", () => {
    expect(slugify("Café & Cia. #1!")).toBe("cafe-cia-1");
  });

  it("trims leading/trailing hyphens produced by punctuation at the edges", () => {
    expect(slugify("--Loja--")).toBe("loja");
  });

  it("caps length at 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long)).toHaveLength(60);
  });

  it("returns an empty string for input with no sluggable characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
