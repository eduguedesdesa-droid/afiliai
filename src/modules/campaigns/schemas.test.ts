import { describe, expect, it } from "vitest";
import { createCampaignSchema, destinationUrlSchema, rewardRuleSchema } from "@/modules/campaigns/schemas";

describe("createCampaignSchema", () => {
  const base = {
    name: "Indique e Ganhe",
    description: null,
    attributionMethod: "LINK" as const,
    conversionType: "SALE" as const,
    approvalMode: "MANUAL" as const,
    attributionWindowDays: "30",
    startDate: null,
    endDate: null,
    destinationUrl: null,
  };

  it("accepts a valid campaign", () => {
    const result = createCampaignSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createCampaignSchema.safeParse({ ...base, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid attribution method", () => {
    const result = createCampaignSchema.safeParse({ ...base, attributionMethod: "CARRIER_PIGEON" });
    expect(result.success).toBe(false);
  });

  it("treats absent optional fields as null, not a validation error (FormData semantics)", () => {
    // `formData.get()` returns null for a field that isn't in the form at
    // all — this is the bug that .nullish() (vs .optional()) exists to fix.
    // `base` already models that: description/startDate/endDate/destinationUrl are null.
    const result = createCampaignSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("parses startDate into a Date", () => {
    const result = createCampaignSchema.safeParse({ ...base, startDate: "2026-01-01" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
    }
  });

  it("rejects a destinationUrl that isn't a valid URL", () => {
    const result = createCampaignSchema.safeParse({ ...base, destinationUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid destinationUrl", () => {
    const result = createCampaignSchema.safeParse({ ...base, destinationUrl: "https://loja.com/produto" });
    expect(result.success).toBe(true);
  });

  it("defaults conversionType, approvalMode and attributionWindowDays", () => {
    const rest = {
      name: base.name,
      description: base.description,
      attributionMethod: base.attributionMethod,
      startDate: base.startDate,
      endDate: base.endDate,
      destinationUrl: base.destinationUrl,
    };
    const result = createCampaignSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversionType).toBe("SALE");
      expect(result.data.approvalMode).toBe("MANUAL");
      expect(result.data.attributionWindowDays).toBe(30);
    }
  });

  it("rejects an attribution window outside 1-365 days", () => {
    expect(createCampaignSchema.safeParse({ ...base, attributionWindowDays: "0" }).success).toBe(false);
    expect(createCampaignSchema.safeParse({ ...base, attributionWindowDays: "400" }).success).toBe(false);
  });
});

describe("destinationUrlSchema", () => {
  it("accepts null (clearing the destination URL)", () => {
    expect(destinationUrlSchema.safeParse({ destinationUrl: null }).success).toBe(true);
  });
});

describe("rewardRuleSchema", () => {
  it("accepts PERCENTAGE with a positive value", () => {
    expect(rewardRuleSchema.safeParse({ rewardType: "PERCENTAGE", value: "10" }).success).toBe(true);
  });

  it("rejects a zero or negative value", () => {
    expect(rewardRuleSchema.safeParse({ rewardType: "FIXED", value: "0" }).success).toBe(false);
    expect(rewardRuleSchema.safeParse({ rewardType: "FIXED", value: "-5" }).success).toBe(false);
  });

  it("rejects a reward type outside PERCENTAGE/FIXED", () => {
    expect(rewardRuleSchema.safeParse({ rewardType: "CASHBACK", value: "10" }).success).toBe(false);
  });
});
