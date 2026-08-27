import * as z from "zod";

export const submitLeadSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe seu nome." }),
  // `.trim().toLowerCase()` roda ANTES da checagem de formato (via `.pipe`)
  // — ver o mesmo padrão/comentário em src/modules/auth/schemas.ts.
  email: z.string().trim().toLowerCase().pipe(z.email({ error: "Informe um e-mail válido." })),
  phone: z.string().trim().nullish(),
});
