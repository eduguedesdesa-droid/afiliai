import * as z from "zod";

/** Campo de texto opcional: string vazia/ausente (semântica de FormData) vira `null`, nunca falha a validação. */
function optionalText(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
    z.string().max(max).nullable()
  );
}

// `.trim().toLowerCase()` roda ANTES da checagem de formato — mesmo racional
// de src/modules/auth/schemas.ts (e-mail colado com espaço nas pontas).
const emailField = z.string().trim().toLowerCase().pipe(z.email({ error: "Informe um e-mail válido." }));

export const addAffiliateManuallySchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome do afiliado." }),
  email: emailField,
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, { error: "O código do cupom precisa ter pelo menos 3 caracteres." })
    .max(30, { error: "O código do cupom pode ter no máximo 30 caracteres." })
    .regex(/^[A-Z0-9]+$/, { error: "Use só letras e números, sem espaços ou acentos, no código do cupom." }),
  phone: optionalText(30),
  city: optionalText(120),
  document: optionalText(20),
  instagramUrl: optionalText(200),
  tiktokUrl: optionalText(200),
  otherSocialUrl: optionalText(200),
});

export const updateAffiliateProfileSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe seu nome." }),
  email: emailField,
  phone: optionalText(30),
  displayName: z.string().trim().min(2, { error: "Informe o nome de exibição." }),
  bio: optionalText(500),
  document: optionalText(20),
  city: optionalText(120),
  instagramUrl: optionalText(200),
  tiktokUrl: optionalText(200),
  otherSocialUrl: optionalText(200),
});
