"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireContext, getCurrentUser } from "@/lib/dal";
import { transitionCommissionStatus } from "@/modules/commissions/service";
import type { CommissionStatus } from "@/generated/prisma/enums";

const VALID_TARGETS = ["APPROVED", "REJECTED", "PAID", "CANCELLED"] as const;

/** Ação da UI (empresa) para aprovar, rejeitar, marcar como paga ou cancelar uma comissão. */
export async function updateCommissionStatus(formData: FormData) {
  const { context } = await requireContext("COMPANY_MEMBER");
  if (context.type !== "COMPANY_MEMBER") return;

  const commissionId = formData.get("commissionId");
  const toStatus = formData.get("toStatus");
  if (typeof commissionId !== "string" || typeof toStatus !== "string") return;
  if (!VALID_TARGETS.includes(toStatus as (typeof VALID_TARGETS)[number])) return;

  // Confere que a comissão pertence a uma campanha desta empresa antes de
  // aceitar a transição — nunca confia só no commissionId vindo do form.
  const commission = await prisma.commission.findFirst({
    where: { id: commissionId, campaignAffiliate: { campaign: { companyId: context.companyId } } },
    select: { id: true },
  });
  if (!commission) return;

  const user = await getCurrentUser();

  await transitionCommissionStatus({
    commissionId: commission.id,
    toStatus: toStatus as CommissionStatus,
    changedByUserId: user.id,
    reason: `Alterado manualmente pela empresa (${toStatus}).`,
  });

  revalidatePath("/empresa/comissoes");
  revalidatePath("/empresa/vendas");
}
