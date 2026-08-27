import * as z from "zod";

export const createSaleSchema = z.object({
  campaignId: z.string().min(1, { error: "Campanha inválida." }),
  grossAmount: z.coerce.number().positive({ error: "Informe um valor de venda maior que zero." }),
  externalOrderId: z.string().trim().nullish(),
  // Um destes três é obrigatório, dependendo do método de atribuição da
  // campanha — validado em código (não dá para expressar isso de forma
  // simples e legível só com Zod aqui).
  couponCode: z.string().trim().nullish(),
  campaignAffiliateId: z.string().trim().nullish(),
  leadId: z.string().trim().nullish(),
});
