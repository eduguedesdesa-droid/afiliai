"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireContext } from "@/lib/dal";
import { createCampaignSchema, rewardRuleSchema, destinationUrlSchema } from "@/modules/campaigns/schemas";
import type { FormState } from "@/lib/form-state";

async function assertCampaignOwnership(campaignId: string, companyId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, companyId },
    select: { id: true },
  });
  return campaign;
}

export async function createCampaign(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return { message: "Contexto inválido." };

  const validated = createCampaignSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    attributionMethod: formData.get("attributionMethod"),
    conversionType: formData.get("conversionType"),
    approvalMode: formData.get("approvalMode"),
    attributionWindowDays: formData.get("attributionWindowDays"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    destinationUrl: formData.get("destinationUrl"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const {
    name,
    description,
    attributionMethod,
    conversionType,
    approvalMode,
    attributionWindowDays,
    startDate,
    endDate,
    destinationUrl,
  } = validated.data;

  const campaign = await prisma.campaign.create({
    data: {
      companyId: context.companyId,
      name,
      description: description || null,
      attributionMethod,
      conversionType,
      approvalMode,
      attributionWindowDays,
      startDate,
      endDate,
      destinationUrl,
      status: "DRAFT",
    },
    select: { id: true },
  });

  revalidatePath("/empresa/campanhas");
  redirect(`/empresa/campanhas/${campaign.id}`);
}

const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ENDED"] as const;

export async function setCampaignStatus(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const campaignId = formData.get("campaignId");
  const status = formData.get("status");
  if (typeof campaignId !== "string" || typeof status !== "string") return;
  if (!CAMPAIGN_STATUSES.includes(status as (typeof CAMPAIGN_STATUSES)[number])) return;

  const campaign = await assertCampaignOwnership(campaignId, context.companyId);
  if (!campaign) return;

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: status as (typeof CAMPAIGN_STATUSES)[number] },
  });

  revalidatePath(`/empresa/campanhas/${campaign.id}`);
  revalidatePath("/empresa/campanhas");
}

export async function upsertRewardRule(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return { message: "Contexto inválido." };

  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string") return { message: "Campanha inválida." };

  const campaign = await assertCampaignOwnership(campaignId, context.companyId);
  if (!campaign) return { message: "Campanha não encontrada." };

  const validated = rewardRuleSchema.safeParse({
    rewardType: formData.get("rewardType"),
    value: formData.get("value"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { rewardType, value } = validated.data;

  const existing = await prisma.rewardRule.findFirst({ where: { campaignId: campaign.id } });

  if (existing) {
    await prisma.rewardRule.update({ where: { id: existing.id }, data: { rewardType, value } });
  } else {
    await prisma.rewardRule.create({ data: { campaignId: campaign.id, rewardType, value } });
  }

  revalidatePath(`/empresa/campanhas/${campaign.id}`);
}

export async function updateCampaignDestination(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return { message: "Contexto inválido." };

  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string") return { message: "Campanha inválida." };

  const campaign = await assertCampaignOwnership(campaignId, context.companyId);
  if (!campaign) return { message: "Campanha não encontrada." };

  const validated = destinationUrlSchema.safeParse({ destinationUrl: formData.get("destinationUrl") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { destinationUrl: validated.data.destinationUrl },
  });

  revalidatePath(`/empresa/campanhas/${campaign.id}`);
}
