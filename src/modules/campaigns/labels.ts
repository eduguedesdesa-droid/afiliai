import type { AttributionMethod, CampaignStatus, RewardType } from "@/generated/prisma/enums";

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ENDED: "Encerrada",
};

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, "neutral" | "positive" | "warning"> = {
  DRAFT: "neutral",
  ACTIVE: "positive",
  PAUSED: "warning",
  ENDED: "neutral",
};

export const ATTRIBUTION_METHOD_LABEL: Record<AttributionMethod, string> = {
  COUPON: "Cupom",
  LINK: "Link rastreável",
  LINK_AND_COUPON: "Link + cupom",
  LEAD: "Lead",
};

export const REWARD_TYPE_LABEL: Record<RewardType, string> = {
  PERCENTAGE: "Percentual sobre a venda",
  FIXED: "Valor fixo por venda",
  CASHBACK: "Cashback",
  STORE_CREDIT: "Crédito na loja",
  DISCOUNT: "Desconto",
  POINTS: "Pontos",
  CUSTOM: "Personalizado",
};
