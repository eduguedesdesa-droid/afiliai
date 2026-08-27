import { describe, expect, it } from "vitest";
import { ALLOWED_TRANSITIONS, computeCommissionAmountCents } from "@/modules/commissions/service";

describe("computeCommissionAmountCents", () => {
  it("computes a PERCENTAGE commission as a share of the gross amount", () => {
    // R$500,00 de venda, 10% de comissão -> R$50,00 = 5000 centavos.
    expect(computeCommissionAmountCents("PERCENTAGE", 10, 50_000n)).toBe(5_000n);
  });

  it("computes a FIXED commission independent of the gross amount", () => {
    expect(computeCommissionAmountCents("FIXED", 25.5, 999_999n)).toBe(2_550n);
  });

  it("rounds to the nearest cent", () => {
    // 33.33% de R$10,00 (1000 centavos) = 333.3 -> arredonda para 333.
    expect(computeCommissionAmountCents("PERCENTAGE", 33.33, 1_000n)).toBe(333n);
  });

  it("accepts a Prisma Decimal-like value (via Number())", () => {
    const decimalLike = { toString: () => "10" };
    expect(computeCommissionAmountCents("PERCENTAGE", decimalLike, 50_000n)).toBe(5_000n);
  });
});

describe("ALLOWED_TRANSITIONS (commission state machine)", () => {
  it("allows PENDING -> APPROVED, PENDING -> REJECTED and PENDING -> CANCELLED", () => {
    // CANCELLED a partir de PENDING é necessário para cancelCommissionsForSale:
    // uma venda pode ser cancelada antes de a comissão ser aprovada/rejeitada.
    expect(ALLOWED_TRANSITIONS.PENDING).toEqual(expect.arrayContaining(["APPROVED", "REJECTED", "CANCELLED"]));
  });

  it("allows APPROVED -> PAID and APPROVED -> CANCELLED", () => {
    expect(ALLOWED_TRANSITIONS.APPROVED).toEqual(expect.arrayContaining(["PAID", "CANCELLED"]));
  });

  it("treats REJECTED, PAID and CANCELLED as terminal states", () => {
    expect(ALLOWED_TRANSITIONS.REJECTED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.PAID).toEqual([]);
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it("never allows skipping straight from PENDING to PAID", () => {
    expect(ALLOWED_TRANSITIONS.PENDING).not.toContain("PAID");
  });
});
