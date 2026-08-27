import type { PayoutStatus } from "@/generated/prisma/enums";

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  PAID: "Pago",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
};

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, "neutral" | "positive" | "warning" | "negative"> = {
  PENDING: "warning",
  PROCESSING: "warning",
  PAID: "positive",
  FAILED: "negative",
  CANCELLED: "neutral",
};
