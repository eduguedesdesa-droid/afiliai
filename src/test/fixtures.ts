import { prisma } from "@/lib/prisma";
import type { ApprovalMode, AttributionMethod, RewardType } from "@/generated/prisma/enums";

let counter = 0;
/** Sufixo curto e único por chamada, para não colidir campos `@unique` entre testes. */
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createCompany(overrides: Partial<{ name: string; status: "ACTIVE" | "SUSPENDED" | "CHURNED" }> = {}) {
  const slug = unique("empresa");
  return prisma.company.create({
    data: {
      name: overrides.name ?? "Loja de Teste",
      slug,
      status: overrides.status ?? "ACTIVE",
    },
  });
}

export async function createAffiliateProfile(overrides: Partial<{ displayName: string }> = {}) {
  const user = await prisma.user.create({
    data: {
      email: `${unique("afiliado")}@teste.afiliai.com`,
      passwordHash: "x",
      name: overrides.displayName ?? "Afiliado de Teste",
    },
  });
  return prisma.affiliateProfile.create({
    data: { userId: user.id, displayName: overrides.displayName ?? "Afiliado de Teste" },
  });
}

type CreateCampaignInput = {
  companyId: string;
  attributionMethod?: AttributionMethod;
  approvalMode?: ApprovalMode;
  attributionWindowDays?: number;
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
};

export async function createCampaign(input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      companyId: input.companyId,
      name: unique("Campanha"),
      attributionMethod: input.attributionMethod ?? "LINK",
      approvalMode: input.approvalMode ?? "MANUAL",
      attributionWindowDays: input.attributionWindowDays ?? 30,
      status: input.status ?? "ACTIVE",
    },
  });
}

export async function createRewardRule(input: { campaignId: string; rewardType?: RewardType; value: number }) {
  return prisma.rewardRule.create({
    data: {
      campaignId: input.campaignId,
      rewardType: input.rewardType ?? "PERCENTAGE",
      value: input.value,
    },
  });
}

export async function createCampaignAffiliate(input: {
  campaignId: string;
  affiliateProfileId: string;
  status?: "INVITED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "REMOVED";
}) {
  return prisma.campaignAffiliate.create({
    data: {
      campaignId: input.campaignId,
      affiliateProfileId: input.affiliateProfileId,
      status: input.status ?? "APPROVED",
    },
  });
}

export async function createAffiliateLink(campaignAffiliateId: string) {
  return prisma.affiliateLink.create({
    data: { campaignAffiliateId, code: unique("LINK").toUpperCase().replace(/[^A-Z0-9]/g, "") },
  });
}

export async function createSale(input: {
  companyId: string;
  campaignId: string;
  affiliateProfileId: string;
  grossAmountCents: bigint;
  attributionMethod?: AttributionMethod;
}) {
  return prisma.sale.create({
    data: {
      companyId: input.companyId,
      campaignId: input.campaignId,
      affiliateProfileId: input.affiliateProfileId,
      grossAmountCents: input.grossAmountCents,
      attributionMethod: input.attributionMethod ?? "LINK",
      status: "CONFIRMED",
    },
  });
}

/**
 * Monta o cenário mais comum de uma vez: empresa ativa, campanha (LINK,
 * aprovação conforme `approvalMode`), regra de recompensa e um afiliado já
 * aprovado na campanha — o ponto de partida da maioria dos testes de
 * commissions/service.ts e tracking/service.ts.
 */
export async function createApprovedCampaignScenario(
  options: { approvalMode?: ApprovalMode; rewardType?: RewardType; rewardValue?: number; attributionWindowDays?: number } = {}
) {
  const company = await createCompany();
  const campaign = await createCampaign({
    companyId: company.id,
    approvalMode: options.approvalMode ?? "MANUAL",
    attributionWindowDays: options.attributionWindowDays ?? 30,
  });
  const rewardRule = await createRewardRule({
    campaignId: campaign.id,
    rewardType: options.rewardType ?? "PERCENTAGE",
    value: options.rewardValue ?? 10,
  });
  const affiliateProfile = await createAffiliateProfile();
  const campaignAffiliate = await createCampaignAffiliate({
    campaignId: campaign.id,
    affiliateProfileId: affiliateProfile.id,
    status: "APPROVED",
  });
  const affiliateLink = await createAffiliateLink(campaignAffiliate.id);

  return { company, campaign, rewardRule, affiliateProfile, campaignAffiliate, affiliateLink };
}
