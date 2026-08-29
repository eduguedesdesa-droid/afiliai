import { describe, expect, it } from "vitest";
import { updateCompanyProfileSchema } from "@/modules/companies/schemas";

const base = {
  name: "Empresa Teste",
  phone: null,
  email: null,
  city: null,
  document: null,
  instagramUrl: null,
  tiktokUrl: null,
  otherSocialUrl: null,
};

describe("updateCompanyProfileSchema", () => {
  it("accepts a minimal valid payload (only the required name)", () => {
    const result = updateCompanyProfileSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = updateCompanyProfileSchema.safeParse({ ...base, name: "A" });
    expect(result.success).toBe(false);
  });

  it("treats empty-string optional fields as null (FormData semantics)", () => {
    const result = updateCompanyProfileSchema.safeParse({ ...base, phone: "", city: "  ", document: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
      expect(result.data.city).toBeNull();
      expect(result.data.document).toBeNull();
    }
  });

  it("trims text fields", () => {
    const result = updateCompanyProfileSchema.safeParse({ ...base, city: "  São Paulo  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe("São Paulo");
    }
  });

  it("normalizes a valid e-mail to lowercase and trims it", () => {
    const result = updateCompanyProfileSchema.safeParse({ ...base, email: "  Contato@Empresa.com  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("contato@empresa.com");
    }
  });

  it("rejects an invalid e-mail when one is provided", () => {
    const result = updateCompanyProfileSchema.safeParse({ ...base, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty e-mail as null instead of failing (optional field)", () => {
    const result = updateCompanyProfileSchema.safeParse({ ...base, email: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });
});
