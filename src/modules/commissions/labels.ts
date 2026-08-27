import type { CommissionStatus } from "@/generated/prisma/enums";

export const COMMISSION_STATUS_LABEL: Record<CommissionStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  PAID: "Paga",
  CANCELLED: "Cancelada",
};

export const COMMISSION_STATUS_TONE: Record<CommissionStatus, "neutral" | "positive" | "warning" | "negative"> = {
  PENDING: "warning",
  APPROVED: "positive",
  REJECTED: "negative",
  PAID: "positive",
  CANCELLED: "neutral",
};

/** Espelha ALLOWED_TRANSITIONS de commissions/service.ts, só para rotular os botões na UI. */
export const NEXT_COMMISSION_STATUS: Record<CommissionStatus, { status: CommissionStatus; label: string }[]> = {
  PENDING: [
    { status: "APPROVED", label: "Aprovar" },
    { status: "REJECTED", label: "Rejeitar" },
  ],
  APPROVED: [
    { status: "PAID", label: "Marcar como paga" },
    { status: "CANCELLED", label: "Cancelar" },
  ],
  REJECTED: [],
  PAID: [],
  CANCELLED: [],
};
