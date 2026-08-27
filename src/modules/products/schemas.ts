import * as z from "zod";

/** Converte um valor de preço em reais (string do formulário, ex.: "49.90") para centavos. */
const priceCentsField = z
  .string()
  .trim()
  .nullish()
  .transform((value) => {
    if (!value) return null;
    const normalized = value.replace(",", ".");
    const reais = Number.parseFloat(normalized);
    if (Number.isNaN(reais)) return null;
    return BigInt(Math.round(reais * 100));
  });

export const createProductSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome do produto." }),
  sku: z.string().trim().nullish(),
  category: z.string().trim().nullish(),
  price: priceCentsField,
});
