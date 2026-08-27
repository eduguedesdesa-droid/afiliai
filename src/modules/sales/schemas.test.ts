import { describe, expect, it } from "vitest";
import { createSaleSchema } from "@/modules/sales/schemas";

describe("createSaleSchema", () => {
  const base = {
    campaignId: "campaign-1",
    grossAmount: "500",
    externalOrderId: null,
    couponCode: null,
    campaignAffiliateId: null,
    leadId: null,
  };

  it("accepts a valid sale with only a coupon code", () => {
    expect(createSaleSchema.safeParse({ ...base, couponCode: "JOAO10" }).success).toBe(true);
  });

  it("rejects a non-positive gross amount", () => {
    expect(createSaleSchema.safeParse({ ...base, grossAmount: "0" }).success).toBe(false);
    expect(createSaleSchema.safeParse({ ...base, grossAmount: "-10" }).success).toBe(false);
  });

  it("rejects an empty campaignId", () => {
    expect(createSaleSchema.safeParse({ ...base, campaignId: "" }).success).toBe(false);
  });

  it("coerces a numeric string gross amount to a number", () => {
    const result = createSaleSchema.safeParse({ ...base, grossAmount: "1234.5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grossAmount).toBe(1234.5);
    }
  });
});
