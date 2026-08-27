import type { SaleStatus } from "@/generated/prisma/enums";

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  REFUNDED: "Estornada",
};

export const SALE_STATUS_TONE: Record<SaleStatus, "neutral" | "positive" | "warning" | "negative"> = {
  PENDING: "warning",
  CONFIRMED: "positive",
  CANCELLED: "negative",
  REFUNDED: "negative",
};
