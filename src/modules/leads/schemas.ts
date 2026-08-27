import * as z from "zod";

export const submitLeadSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe seu nome." }),
  email: z.email({ error: "Informe um e-mail válido." }).trim().toLowerCase(),
  phone: z.string().trim().nullish(),
});
