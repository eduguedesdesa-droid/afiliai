"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireContext } from "@/lib/dal";
import { createSaleSchema } from "@/modules/sales/schemas";
import { createCommissionForSale, cancelCommissionsForSale } from "@/modules/commissions/service";
import type { FormState } from "@/lib/form-state";

/**
 * Registra uma venda manualmente e, se possível, sua comissão. A atribuição
 * ao afiliado depende do método da campanha — nunca é um campo livre do
 * formulário sem validação:
 * - COUPON / LINK_AND_COUPON: resolve pelo código do cupom digitado.
 * - LINK: a empresa escolhe manualmente o afiliado aprovado na campanha
 *   (sem uma integração de checkout real, não há como resolver sozinho).
 * - LEAD: a empresa escolhe um lead da campanha que já tem afiliado
 *   atribuído — leads sem afiliado não geram comissão, então não aparecem
 *   como opção.
 */
export async function createSale(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return { message: "Contexto inválido." };

  const validated = createSaleSchema.safeParse({
    campaignId: formData.get("campaignId"),
    grossAmount: formData.get("grossAmount"),
    externalOrderId: formData.get("externalOrderId"),
    couponCode: formData.get("couponCode"),
    campaignAffiliateId: formData.get("campaignAffiliateId"),
    leadId: formData.get("leadId"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { campaignId, grossAmount, externalOrderId, couponCode, campaignAffiliateId, leadId } = validated.data;

  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, companyId: context.companyId } });
  if (!campaign) return { message: "Campanha não encontrada." };

  let resolvedCampaignAffiliateId: string | null = null;
  let resolvedAffiliateProfileId: string | null = null;
  let resolvedCouponId: string | null = null;
  let resolvedLeadId: string | null = null;

  if (campaign.attributionMethod === "COUPON" || campaign.attributionMethod === "LINK_AND_COUPON") {
    if (!couponCode) return { errors: { couponCode: ["Informe o código do cupom."] } };

    const coupon = await prisma.coupon.findFirst({
      where: { code: couponCode, active: true, campaignAffiliate: { campaignId: campaign.id, status: "APPROVED" } },
      include: { campaignAffiliate: true },
    });
    if (!coupon) return { errors: { couponCode: ["Cupom não encontrado ou inválido para esta campanha."] } };

    resolvedCouponId = coupon.id;
    resolvedCampaignAffiliateId = coupon.campaignAffiliate.id;
    resolvedAffiliateProfileId = coupon.campaignAffiliate.affiliateProfileId;
  } else if (campaign.attributionMethod === "LINK") {
    if (!campaignAffiliateId) return { errors: { campaignAffiliateId: ["Selecione o afiliado."] } };

    const campaignAffiliate = await prisma.campaignAffiliate.findFirst({
      where: { id: campaignAffiliateId, campaignId: campaign.id, status: "APPROVED" },
    });
    if (!campaignAffiliate) return { errors: { campaignAffiliateId: ["Afiliado inválido para esta campanha."] } };

    resolvedCampaignAffiliateId = campaignAffiliate.id;
    resolvedAffiliateProfileId = campaignAffiliate.affiliateProfileId;
  } else if (campaign.attributionMethod === "LEAD") {
    if (!leadId) return { errors: { leadId: ["Selecione o lead."] } };

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, campaignId: campaign.id, affiliateProfileId: { not: null } },
    });
    if (!lead?.affiliateProfileId) return { errors: { leadId: ["Lead inválido ou sem afiliado atribuído."] } };

    const campaignAffiliate = await prisma.campaignAffiliate.findFirst({
      where: { campaignId: campaign.id, affiliateProfileId: lead.affiliateProfileId, status: "APPROVED" },
    });
    if (!campaignAffiliate) {
      return { errors: { leadId: ["O afiliado deste lead não está mais aprovado nesta campanha."] } };
    }

    resolvedCampaignAffiliateId = campaignAffiliate.id;
    resolvedAffiliateProfileId = campaignAffiliate.affiliateProfileId;
    resolvedLeadId = lead.id;
  }

  if (!resolvedCampaignAffiliateId || !resolvedAffiliateProfileId) {
    return { message: "Não foi possível atribuir esta venda a um afiliado." };
  }

  const grossAmountCents = BigInt(Math.round(grossAmount * 100));

  let saleId: string;
  try {
    const sale = await prisma.sale.create({
      data: {
        companyId: context.companyId,
        campaignId: campaign.id,
        affiliateProfileId: resolvedAffiliateProfileId,
        leadId: resolvedLeadId,
        couponId: resolvedCouponId,
        attributionMethod: campaign.attributionMethod,
        grossAmountCents,
        externalOrderId: externalOrderId || null,
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      select: { id: true },
    });
    saleId = sale.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { externalOrderId: ["Já existe uma venda com este identificador de pedido."] } };
    }
    throw error;
  }

  if (resolvedLeadId) {
    await prisma.lead.update({ where: { id: resolvedLeadId }, data: { status: "CONVERTED" } });
  }

  await createCommissionForSale({
    saleId,
    campaignId: campaign.id,
    campaignAffiliateId: resolvedCampaignAffiliateId,
    grossAmountCents,
  });

  revalidatePath("/empresa/vendas");
  revalidatePath("/empresa/comissoes");
  revalidatePath("/empresa/leads");
  redirect("/empresa/vendas");
}

/** Cancela uma venda e propaga o cancelamento para as comissões que ainda podem ser canceladas. */
export async function cancelSale(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const saleId = formData.get("saleId");
  if (typeof saleId !== "string") return;

  const sale = await prisma.sale.findFirst({ where: { id: saleId, companyId: context.companyId } });
  if (!sale || sale.status === "CANCELLED") return;

  await prisma.sale.update({ where: { id: sale.id }, data: { status: "CANCELLED" } });
  await cancelCommissionsForSale(sale.id, "Venda cancelada pela empresa.");

  revalidatePath("/empresa/vendas");
  revalidatePath("/empresa/comissoes");
}
