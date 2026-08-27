import { describe, expect, it } from "vitest";
import { submitLeadSchema } from "@/modules/leads/schemas";

describe("submitLeadSchema", () => {
  it("accepts a valid lead", () => {
    const result = submitLeadSchema.safeParse({ name: "Maria", email: "MARIA@Exemplo.com", phone: null });
    expect(result.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    const result = submitLeadSchema.safeParse({ name: "Maria", email: "  MARIA@Exemplo.com  ", phone: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("maria@exemplo.com");
    }
  });

  it("rejects an invalid email", () => {
    expect(submitLeadSchema.safeParse({ name: "Maria", email: "not-an-email", phone: null }).success).toBe(false);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(submitLeadSchema.safeParse({ name: "M", email: "maria@exemplo.com", phone: null }).success).toBe(false);
  });
});
