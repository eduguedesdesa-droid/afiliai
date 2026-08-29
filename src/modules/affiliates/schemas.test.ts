import { describe, expect, it } from "vitest";
import { addAffiliateManuallySchema, updateAffiliateProfileSchema } from "@/modules/affiliates/schemas";

const base = {
  name: "Afiliado Teste",
  email: "afiliado@teste.com",
  phone: null,
  displayName: "Afiliado Teste",
  bio: null,
  document: null,
  city: null,
  instagramUrl: null,
  tiktokUrl: null,
  otherSocialUrl: null,
};

describe("updateAffiliateProfileSchema", () => {
  it("accepts a minimal valid payload (only the required fields)", () => {
    const result = updateAffiliateProfileSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects a missing e-mail", () => {
    const result = updateAffiliateProfileSchema.safeParse({ ...base, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid e-mail", () => {
    const result = updateAffiliateProfileSchema.safeParse({ ...base, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("normalizes e-mail to lowercase and trims it", () => {
    const result = updateAffiliateProfileSchema.safeParse({ ...base, email: "  Afiliado@Teste.com  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("afiliado@teste.com");
    }
  });

  it("rejects a displayName shorter than 2 characters", () => {
    const result = updateAffiliateProfileSchema.safeParse({ ...base, displayName: "A" });
    expect(result.success).toBe(false);
  });

  it("treats empty-string optional fields as null (FormData semantics)", () => {
    const result = updateAffiliateProfileSchema.safeParse({ ...base, phone: "", bio: "", document: "", city: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
      expect(result.data.bio).toBeNull();
      expect(result.data.document).toBeNull();
      expect(result.data.city).toBeNull();
    }
  });

  it("trims optional text fields", () => {
    const result = updateAffiliateProfileSchema.safeParse({ ...base, city: "  Rio de Janeiro  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe("Rio de Janeiro");
    }
  });
});

const addAffiliateBase = {
  name: "Novo Afiliado",
  email: "novo.afiliado@teste.com",
  couponCode: "novo10",
  phone: null,
  city: null,
  document: null,
  instagramUrl: null,
  tiktokUrl: null,
  otherSocialUrl: null,
};

describe("addAffiliateManuallySchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = addAffiliateManuallySchema.safeParse(addAffiliateBase);
    expect(result.success).toBe(true);
  });

  it("uppercases the coupon code", () => {
    const result = addAffiliateManuallySchema.safeParse({ ...addAffiliateBase, couponCode: "novo10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.couponCode).toBe("NOVO10");
    }
  });

  it("rejects a coupon code with spaces or symbols", () => {
    const result = addAffiliateManuallySchema.safeParse({ ...addAffiliateBase, couponCode: "novo 10!" });
    expect(result.success).toBe(false);
  });

  it("rejects a coupon code shorter than 3 characters", () => {
    const result = addAffiliateManuallySchema.safeParse({ ...addAffiliateBase, couponCode: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing e-mail", () => {
    const result = addAffiliateManuallySchema.safeParse({ ...addAffiliateBase, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = addAffiliateManuallySchema.safeParse({ ...addAffiliateBase, name: "A" });
    expect(result.success).toBe(false);
  });

  it("treats empty-string optional fields as null (FormData semantics)", () => {
    const result = addAffiliateManuallySchema.safeParse({ ...addAffiliateBase, phone: "", city: "", document: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
      expect(result.data.city).toBeNull();
      expect(result.data.document).toBeNull();
    }
  });
});
