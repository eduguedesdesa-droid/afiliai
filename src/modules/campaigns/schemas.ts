import * as z from "zod";

const dateField = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? new Date(value) : null));

const optionalUrlField = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || z.url().safeParse(value).success, {
    error: "Informe uma URL válida (começando com http:// ou https://).",
  });

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome da campanha." }),
  description: z.string().trim().nullish(),
  attributionMethod: z.enum(["COUPON", "LINK", "LINK_AND_COUPON", "LEAD"], {
    error: "Selecione um método de atribuição.",
  }),
  conversionType: z.enum(["SALE", "LEAD"]).default("SALE"),
  approvalMode: z.enum(["AUTO", "MANUAL"]).default("MANUAL"),
  attributionWindowDays: z.coerce.number().int().min(1).max(365).default(30),
  startDate: dateField,
  endDate: dateField,
  destinationUrl: optionalUrlField,
});

export const destinationUrlSchema = z.object({
  destinationUrl: optionalUrlField,
});

/**
 * `value` tem unidade diferente por tipo: para PERCENTAGE é um percentual
 * (ex.: 10 = 10%); para FIXED é um valor em reais (ex.: 25.5 = R$25,50).
 * Guardado como Decimal (não BigInt em centavos) porque também representa
 * percentuais, que não fazem sentido em "centavos".
 */
export const rewardRuleSchema = z.object({
  rewardType: z.enum(["PERCENTAGE", "FIXED"], { error: "Selecione o tipo de recompensa." }),
  value: z.coerce.number().positive({ error: "Informe um valor maior que zero." }),
});
