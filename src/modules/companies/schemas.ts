import * as z from "zod";

/** Campo de texto opcional: string vazia/ausente (semântica de FormData) vira `null`, nunca falha a validação. */
function optionalText(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
    z.string().max(max).nullable()
  );
}

/** E-mail opcional: vazio vira `null`; quando preenchido, precisa ser um e-mail válido. */
const optionalEmailField = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null),
  z.email({ error: "Informe um e-mail válido." }).nullable()
);

export const updateCompanyProfileSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome da empresa." }),
  phone: optionalText(30),
  email: optionalEmailField,
  city: optionalText(120),
  document: optionalText(20),
  instagramUrl: optionalText(200),
  tiktokUrl: optionalText(200),
  otherSocialUrl: optionalText(200),
});
