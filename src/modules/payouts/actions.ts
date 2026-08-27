"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireContext, getCurrentUser } from "@/lib/dal";
import { transitionCommissionStatus } from "@/modules/commissions/service";

/**
 * Agrupa comissões APROVADAS de um afiliado (ainda não incluídas em nenhum
 * outro pagamento) num lote de pagamento. Nunca confia nos ids que vêm do
 * formulário sem revalidar status + posse — um checkbox marcado no
 * navegador não é permissão.
 */
export async function createPayout(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const affiliateProfileId = formData.get("affiliateProfileId");
  const requestedCommissionIds = formData.getAll("commissionId").filter((v): v is string => typeof v === "string");
  if (typeof affiliateProfileId !== "string" || requestedCommissionIds.length === 0) return;

  const eligibleCommissions = await prisma.commission.findMany({
    where: {
      id: { in: requestedCommissionIds },
      status: "APPROVED",
      payoutItems: { none: {} },
      campaignAffiliate: {
        affiliateProfileId,
        campaign: { companyId: context.companyId },
      },
    },
    select: { id: true, amountCents: true },
  });

  if (eligibleCommissions.length === 0) return;

  const totalAmountCents = eligibleCommissions.reduce((sum, c) => sum + c.amountCents, 0n);

  const payout = await prisma.payout.create({
    data: {
      companyId: context.companyId,
      affiliateProfileId,
      totalAmountCents,
      status: "PENDING",
      items: {
        create: eligibleCommissions.map((c) => ({ commissionId: c.id })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/empresa/payouts");
  redirect(`/empresa/payouts/${payout.id}`);
}

/** Marca o lote como pago e transiciona cada comissão incluída para PAID. */
export async function markPayoutPaid(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const payoutId = formData.get("payoutId");
  if (typeof payoutId !== "string") return;

  const payout = await prisma.payout.findFirst({
    where: { id: payoutId, companyId: context.companyId },
    include: { items: { select: { commissionId: true } } },
  });
  if (!payout || payout.status === "PAID") return;

  const user = await getCurrentUser();

  await prisma.payout.update({ where: { id: payout.id }, data: { status: "PAID", paidAt: new Date() } });

  for (const item of payout.items) {
    await transitionCommissionStatus({
      commissionId: item.commissionId,
      toStatus: "PAID",
      changedByUserId: user.id,
      reason: "Pago via lote de pagamento.",
    });
  }

  revalidatePath("/empresa/payouts");
  revalidatePath(`/empresa/payouts/${payout.id}`);
  revalidatePath("/empresa/comissoes");
}
