import type { CompanyStatus, UserStatus } from "@/generated/prisma/enums";

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  CHURNED: "Encerrada",
};

export const COMPANY_STATUS_TONE: Record<CompanyStatus, "neutral" | "positive" | "negative"> = {
  ACTIVE: "positive",
  SUSPENDED: "negative",
  CHURNED: "neutral",
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  PENDING_VERIFICATION: "Verificação pendente",
};

export const USER_STATUS_TONE: Record<UserStatus, "neutral" | "positive" | "warning" | "negative"> = {
  ACTIVE: "positive",
  SUSPENDED: "negative",
  PENDING_VERIFICATION: "warning",
};
