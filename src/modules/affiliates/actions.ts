"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireContext } from "@/lib/dal";
import { ensureCouponForCampaignAffiliate, ensureAffiliateLinkForCampaignAffiliate } from "@/modules/tracking/service";
import { updateAffiliateProfileSchema } from "@/modules/affiliates/schemas";
import type { FormState } from "@/lib/form-state";

/** Afiliado solicita participação numa campanha ativa (fica PENDING_APPROVAL até a empresa decidir). */
export async function requestToJoinCampaign(formData: FormData) {
  const { user, context } = await requireContext("AFFILIATE");
  if (context.type !== "AFFILIATE") return;

  const affiliateProfileId = user.affiliateProfile?.id;
  if (!affiliateProfileId) return;

  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string") return;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, status: "ACTIVE", company: { status: "ACTIVE" } },
    select: { id: true },
  });
  if (!campaign) return;

  const existing = await prisma.campaignAffiliate.findUnique({
    where: { campaignId_affiliateProfileId: { campaignId: campaign.id, affiliateProfileId } },
  });
  if (existing) return; // já solicitou/participa — nada a fazer

  await prisma.campaignAffiliate.create({
    data: { campaignId: campaign.id, affiliateProfileId, status: "PENDING_APPROVAL" },
  });

  revalidatePath("/afiliado/campanhas-disponiveis");
  revalidatePath("/afiliado/minhas-campanhas");
}

const DECISIONS = ["APPROVED", "REJECTED"] as const;

/**
 * Empresa aprova ou rejeita uma solicitação de participação. Ao aprovar,
 * gera automaticamente o cupom e/ou link do afiliado conforme o método de
 * atribuição da campanha (COUPON, LINK, LINK_AND_COUPON ou LEAD — que também
 * usa link, ver README de tracking).
 */
export async function respondToJoinRequest(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const campaignAffiliateId = formData.get("campaignAffiliateId");
  const decision = formData.get("decision");
  if (typeof campaignAffiliateId !== "string" || typeof decision !== "string") return;
  if (!DECISIONS.includes(decision as (typeof DECISIONS)[number])) return;

  const campaignAffiliate = await prisma.campaignAffiliate.findFirst({
    where: { id: campaignAffiliateId, campaign: { companyId: context.companyId } },
    include: { campaign: true, affiliateProfile: true },
  });
  if (!campaignAffiliate) return;

  await prisma.campaignAffiliate.update({
    where: { id: campaignAffiliate.id },
    data: {
      status: decision as (typeof DECISIONS)[number],
      joinedAt: decision === "APPROVED" ? new Date() : campaignAffiliate.joinedAt,
    },
  });

  if (decision === "APPROVED") {
    const { attributionMethod } = campaignAffiliate.campaign;
    const { displayName } = campaignAffiliate.affiliateProfile;
    const needsCoupon = attributionMethod === "COUPON" || attributionMethod === "LINK_AND_COUPON";
    const needsLink =
      attributionMethod === "LINK" || attributionMethod === "LINK_AND_COUPON" || attributionMethod === "LEAD";

    if (needsCoupon) await ensureCouponForCampaignAffiliate(campaignAffiliate.id, displayName);
    if (needsLink) await ensureAffiliateLinkForCampaignAffiliate(campaignAffiliate.id, displayName);
  }

  revalidatePath("/empresa/afiliados");
  revalidatePath(`/empresa/campanhas/${campaignAffiliate.campaignId}`);
  revalidatePath("/afiliado/minhas-campanhas");
  revalidatePath("/afiliado/links");
  revalidatePath("/afiliado/cupons");
}

/** Afiliado edita o próprio perfil (dados de conta + contato, cidade, documento, redes sociais) em /afiliado/perfil. */
export async function updateAffiliateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user, context } = await requireContext("AFFILIATE");
  if (context.type !== "AFFILIATE") return { message: "Contexto inválido." };

  const affiliateProfileId = user.affiliateProfile?.id;
  if (!affiliateProfileId) return { message: "Perfil de afiliado não encontrado." };

  const validated = updateAffiliateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    document: formData.get("document"),
    city: formData.get("city"),
    instagramUrl: formData.get("instagramUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    otherSocialUrl: formData.get("otherSocialUrl"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, phone, displayName, bio, document, city, instagramUrl, tiktokUrl, otherSocialUrl } =
    validated.data;

  // E-mail é a credencial de login (User.email é @unique) — precisa checar
  // que outra conta não esteja usando esse valor antes de gravar.
  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
    select: { id: true },
  });
  if (emailTaken) {
    return { errors: { email: ["Já existe uma conta com este e-mail."] } };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name, email, phone } }),
    prisma.affiliateProfile.update({
      where: { id: affiliateProfileId },
      data: { displayName, bio, document, city, instagramUrl, tiktokUrl, otherSocialUrl },
    }),
  ]);

  revalidatePath("/afiliado/perfil");
  revalidatePath("/afiliado");

  return { message: "Perfil atualizado com sucesso.", success: true };
}
