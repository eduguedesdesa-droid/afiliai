import { describe, expect, it } from "vitest";
import {
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  signupAfiliadoSchema,
  signupEmpresaSchema,
} from "@/modules/auth/schemas";

describe("signupEmpresaSchema", () => {
  it("accepts a valid company signup", () => {
    const result = signupEmpresaSchema.safeParse({
      name: "Ana",
      email: "ana@empresa.com",
      password: "senha123",
      companyName: "Loja XYZ",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password without a letter", () => {
    const result = signupEmpresaSchema.safeParse({
      name: "Ana",
      email: "ana@empresa.com",
      password: "12345678",
      companyName: "Loja XYZ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = signupEmpresaSchema.safeParse({
      name: "Ana",
      email: "ana@empresa.com",
      password: "senhasenha",
      companyName: "Loja XYZ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signupEmpresaSchema.safeParse({
      name: "Ana",
      email: "ana@empresa.com",
      password: "abc123",
      companyName: "Loja XYZ",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupAfiliadoSchema", () => {
  it("accepts a valid affiliate signup (no companyName field)", () => {
    const result = signupAfiliadoSchema.safeParse({ name: "João", email: "joao@exemplo.com", password: "senha123" });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });

  it("lowercases the email", () => {
    const result = loginSchema.safeParse({ email: "Ana@Empresa.COM", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ana@empresa.com");
    }
  });

  it("trims whitespace before validating the email format (not after)", () => {
    // Regressão: `z.email().trim()` valida o formato ANTES de aparar os
    // espaços, então um e-mail colado com espaço nas pontas seria rejeitado.
    const result = loginSchema.safeParse({ email: "  ana@empresa.com  ", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ana@empresa.com");
    }
  });
});

describe("requestPasswordResetSchema", () => {
  it("rejects an invalid email", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched password/confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      token: "tok",
      password: "senha123",
      confirmPassword: "outrasenha1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "tok",
      password: "senha123",
      confirmPassword: "senha123",
    });
    expect(result.success).toBe(true);
  });
});
