import "server-only";
import { prisma } from "@/lib/prisma";
import type { CommissionStatus, RewardType } from "@/generated/prisma/enums";

// Módulo "Comissões" — ver README.md desta pasta.
// Motor de cálculo + máquina de estados. Nenhuma função aqui é uma Server
// Action ("use server") — são chamadas internamente por src/modules/sales
// (ao registrar uma venda) e por src/modules/commissions/actions.ts (que
// expõe a transição de status à UI, já validando autorização).

/**
 * `rewardRule.value` tem unidade diferente por tipo (ver comentário no
 * schema): PERCENTAGE é um percentual do valor bruto da venda; FIXED é um
 * valor fixo em reais, independente do valor da venda.
 */
export function computeCommissionAmountCents(
  rewardType: RewardType,
  value: unknown,
  grossAmountCents: bigint
): bigint {
  const valueNumber = Number(value);

  if (rewardType === "PERCENTAGE") {
    return BigInt(Math.round(Number(grossAmountCents) * (valueNumber / 100)));
  }

  // FIXED (e demais tipos simples futuros): valor fixo em reais.
  return BigInt(Math.round(valueNumber * 100));
}

type CreateCommissionInput = {
  saleId: string;
  campaignId: string;
  campaignAffiliateId: string;
  grossAmountCents: bigint;
};

/**
 * Cria a comissão de uma venda recém-registrada, a partir da regra de
 * recompensa ativa da campanha. Se a campanha ainda não tem regra
 * configurada, a venda fica registrada mas sem comissão — a empresa pode
 * voltar depois de configurar a regra (não há reprocessamento automático
 * ainda; ver README).
 */
export async function createCommissionForSale(input: CreateCommissionInput) {
  const [campaign, rewardRule] = await Promise.all([
    prisma.campaign.findUnique({ where: { id: input.campaignId }, select: { approvalMode: true } }),
    prisma.rewardRule.findFirst({ where: { campaignId: input.campaignId, active: true } }),
  ]);

  if (!campaign || !rewardRule || rewardRule.value === null) {
    return null;
  }

  const amountCents = computeCommissionAmountCents(rewardRule.rewardType, rewardRule.value, input.grossAmountCents);
  const initialStatus: CommissionStatus = campaign.approvalMode === "AUTO" ? "APPROVED" : "PENDING";

  const commission = await prisma.commission.create({
    data: {
      saleId: input.saleId,
      campaignAffiliateId: input.campaignAffiliateId,
      rewardRuleId: rewardRule.id,
      amountCents,
      type: rewardRule.rewardType,
      status: initialStatus,
    },
  });

  await prisma.commissionStatusHistory.create({
    data: {
      commissionId: commission.id,
      fromStatus: null,
      toStatus: initialStatus,
      reason: "Comissão criada a partir da venda.",
    },
  });

  return commission;
}

/** Único lugar do sistema que decide quais transições de status são permitidas. */
export const ALLOWED_TRANSITIONS: Record<CommissionStatus, CommissionStatus[]> = {
  // PENDING -> CANCELLED existe para `cancelCommissionsForSale`: uma venda
  // pode ser cancelada antes que a empresa chegue a aprovar/rejeitar a
  // comissão gerada por ela.
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["PAID", "CANCELLED"],
  REJECTED: [],
  PAID: [],
  CANCELLED: [],
};

type TransitionInput = {
  commissionId: string;
  toStatus: CommissionStatus;
  changedByUserId?: string | null;
  reason?: string | null;
};

/**
 * Único ponto que altera `Commission.status` — nunca fazer UPDATE direto.
 * Toda transição, permitida ou não, é auditável: se não for permitida,
 * retorna `false` sem tocar o banco.
 */
export async function transitionCommissionStatus(input: TransitionInput): Promise<boolean> {
  const commission = await prisma.commission.findUnique({
    where: { id: input.commissionId },
    select: { id: true, status: true },
  });
  if (!commission) return false;

  const allowed = ALLOWED_TRANSITIONS[commission.status] ?? [];
  if (!allowed.includes(input.toStatus)) return false;

  await prisma.commission.update({ where: { id: commission.id }, data: { status: input.toStatus } });
  await prisma.commissionStatusHistory.create({
    data: {
      commissionId: commission.id,
      fromStatus: commission.status,
      toStatus: input.toStatus,
      changedByUserId: input.changedByUserId ?? null,
      reason: input.reason ?? null,
    },
  });

  return true;
}

/** Chamado quando uma venda é cancelada/estornada — cancela as comissões que ainda podem ser canceladas. */
export async function cancelCommissionsForSale(saleId: string, reason: string) {
  const commissions = await prisma.commission.findMany({
    where: { saleId, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true },
  });

  for (const commission of commissions) {
    await transitionCommissionStatus({ commissionId: commission.id, toStatus: "CANCELLED", reason });
  }
}
