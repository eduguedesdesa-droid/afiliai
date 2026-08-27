import * as z from "zod";

const passwordSchema = z
  .string()
  .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "A senha precisa conter pelo menos uma letra." })
  .regex(/[0-9]/, { error: "A senha precisa conter pelo menos um número." });

// `.trim().toLowerCase()` roda ANTES da checagem de formato (via `.pipe`),
// não depois: um e-mail colado com espaço nas pontas (comum em copiar/colar)
// tem que ser normalizado antes de validar, senão a checagem de formato
// rejeita o espaço e nunca chega a normalizar nada.
const emailField = z.string().trim().toLowerCase().pipe(z.email({ error: "Informe um e-mail válido." }));

export const signupEmpresaSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe seu nome." }),
  email: emailField,
  password: passwordSchema,
  companyName: z.string().trim().min(2, { error: "Informe o nome da empresa." }),
});

export const signupAfiliadoSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe seu nome." }),
  email: emailField,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export const requestPasswordResetSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { error: "Confirme a nova senha." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não conferem.",
    path: ["confirmPassword"],
  });
