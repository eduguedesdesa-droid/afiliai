import { describe, expect, it } from "vitest";
import { createProductSchema } from "@/modules/products/schemas";

describe("createProductSchema", () => {
  it("converts a reais price string to integer cents", () => {
    const result = createProductSchema.safeParse({ name: "Produto", sku: null, category: null, price: "49.90" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(4990n);
    }
  });

  it("accepts a comma decimal separator", () => {
    const result = createProductSchema.safeParse({ name: "Produto", sku: null, category: null, price: "49,90" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(4990n);
    }
  });

  it("treats an absent price as null rather than failing (FormData semantics)", () => {
    const result = createProductSchema.safeParse({ name: "Produto", sku: null, category: null, price: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBeNull();
    }
  });

  it("treats a non-numeric price as null instead of throwing", () => {
    const result = createProductSchema.safeParse({ name: "Produto", sku: null, category: null, price: "abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBeNull();
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createProductSchema.safeParse({ name: "A", sku: null, category: null, price: null });
    expect(result.success).toBe(false);
  });
});
