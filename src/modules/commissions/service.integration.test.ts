import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/db-reset";
import { createApprovedCampaignScenario, createSale } from "@/test/fixtures";
import { cancelCommissionsForSale, createCommissionForSale, transitionCommissionStatus } from "@/modules/commissions/service";

beforeEach(async () => {
  await resetDatabase();
});

describe("createCommissionForSale", () => {
  it("creates an APPROVED commission when the campaign's approvalMode is AUTO", async () => {
    const scenario = await createApprovedCampaignScenario({ approvalMode: "AUTO", rewardValue: 10 });
    const sale = await createSale({
      companyId: scenario.company.id,
      campaignId: scenario.campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 50_000n, // R$500,00
    });

    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: scenario.campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });

    expect(commission).not.toBeNull();
    expect(commission?.status).toBe("APPROVED");
    expect(commission?.amountCents).toBe(5_000n); // 10% de R$500,00
    expect(commission?.type).toBe("PERCENTAGE");
  });

  it("creates a PENDING commission when the campaign's approvalMode is MANUAL", async () => {
    const scenario = await createApprovedCampaignScenario({ approvalMode: "MANUAL", rewardValue: 10 });
    const sale = await createSale({
      companyId: scenario.company.id,
      campaignId: scenario.campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 50_000n,
    });

    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: scenario.campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });

    expect(commission?.status).toBe("PENDING");
  });

  it("computes a FIXED reward independent of the sale amount", async () => {
    const scenario = await createApprovedCampaignScenario({ rewardType: "FIXED", rewardValue: 25 });
    const sale = await createSale({
      companyId: scenario.company.id,
      campaignId: scenario.campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 999_999n,
    });

    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: scenario.campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });

    expect(commission?.amountCents).toBe(2_500n);
  });

  it("writes a CommissionStatusHistory row with fromStatus null on creation", async () => {
    const scenario = await createApprovedCampaignScenario({ approvalMode: "AUTO" });
    const sale = await createSale({
      companyId: scenario.company.id,
      campaignId: scenario.campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 10_000n,
    });

    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: scenario.campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });

    const history = await prisma.commissionStatusHistory.findMany({ where: { commissionId: commission!.id } });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ fromStatus: null, toStatus: "APPROVED" });
  });

  it("returns null and creates nothing when the campaign has no active reward rule", async () => {
    const company = await prisma.company.create({ data: { name: "Empresa sem regra", slug: `sem-regra-${Date.now()}` } });
    const campaign = await prisma.campaign.create({
      data: { companyId: company.id, name: "Campanha sem regra", attributionMethod: "LINK" },
    });
    const scenario = await createApprovedCampaignScenario();
    const sale = await createSale({
      companyId: company.id,
      campaignId: campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 10_000n,
    });

    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });

    expect(commission).toBeNull();
    expect(await prisma.commission.count()).toBe(0);
  });
});

describe("transitionCommissionStatus", () => {
  async function pendingCommission() {
    const scenario = await createApprovedCampaignScenario({ approvalMode: "MANUAL" });
    const sale = await createSale({
      companyId: scenario.company.id,
      campaignId: scenario.campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 10_000n,
    });
    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: scenario.campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });
    return commission!;
  }

  it("allows PENDING -> APPROVED and records history with the actor and reason", async () => {
    const commission = await pendingCommission();
    const admin = await prisma.user.create({
      data: { email: `admin-${Date.now()}@teste.afiliai.com`, passwordHash: "x", name: "Admin de Teste" },
    });

    const ok = await transitionCommissionStatus({
      commissionId: commission.id,
      toStatus: "APPROVED",
      changedByUserId: admin.id,
      reason: "conferido manualmente",
    });

    expect(ok).toBe(true);
    const updated = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } });
    expect(updated.status).toBe("APPROVED");

    const history = await prisma.commissionStatusHistory.findMany({
      where: { commissionId: commission.id },
      orderBy: { id: "asc" },
    });
    expect(history.at(-1)).toMatchObject({
      fromStatus: "PENDING",
      toStatus: "APPROVED",
      changedByUserId: admin.id,
      reason: "conferido manualmente",
    });
  });

  it("rejects an illegal transition (PENDING -> PAID) and leaves status/history untouched", async () => {
    const commission = await pendingCommission();

    const ok = await transitionCommissionStatus({ commissionId: commission.id, toStatus: "PAID" });

    expect(ok).toBe(false);
    const unchanged = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } });
    expect(unchanged.status).toBe("PENDING");
    expect(await prisma.commissionStatusHistory.count({ where: { commissionId: commission.id } })).toBe(1);
  });

  it("rejects any transition out of a terminal state (REJECTED)", async () => {
    const commission = await pendingCommission();
    await transitionCommissionStatus({ commissionId: commission.id, toStatus: "REJECTED" });

    const ok = await transitionCommissionStatus({ commissionId: commission.id, toStatus: "APPROVED" });

    expect(ok).toBe(false);
    const unchanged = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } });
    expect(unchanged.status).toBe("REJECTED");
  });

  it("returns false for a commission id that doesn't exist", async () => {
    const ok = await transitionCommissionStatus({ commissionId: "00000000-0000-0000-0000-000000000000", toStatus: "APPROVED" });
    expect(ok).toBe(false);
  });
});

describe("cancelCommissionsForSale", () => {
  it("cancels PENDING and APPROVED commissions for the sale, leaving PAID ones alone", async () => {
    const scenario = await createApprovedCampaignScenario({ approvalMode: "MANUAL" });
    const sale = await createSale({
      companyId: scenario.company.id,
      campaignId: scenario.campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 10_000n,
    });
    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: scenario.campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });

    await cancelCommissionsForSale(sale.id, "venda cancelada");

    const updated = await prisma.commission.findUniqueOrThrow({ where: { id: commission!.id } });
    expect(updated.status).toBe("CANCELLED");
  });

  it("does not touch a commission that's already PAID", async () => {
    const scenario = await createApprovedCampaignScenario({ approvalMode: "AUTO" });
    const sale = await createSale({
      companyId: scenario.company.id,
      campaignId: scenario.campaign.id,
      affiliateProfileId: scenario.affiliateProfile.id,
      grossAmountCents: 10_000n,
    });
    const commission = await createCommissionForSale({
      saleId: sale.id,
      campaignId: scenario.campaign.id,
      campaignAffiliateId: scenario.campaignAffiliate.id,
      grossAmountCents: sale.grossAmountCents,
    });
    await transitionCommissionStatus({ commissionId: commission!.id, toStatus: "PAID" });

    await cancelCommissionsForSale(sale.id, "venda cancelada");

    const unchanged = await prisma.commission.findUniqueOrThrow({ where: { id: commission!.id } });
    expect(unchanged.status).toBe("PAID");
  });
});
