import "server-only";
import * as z from "zod";

/**
 * Validação central das variáveis de ambiente. Falha rápido e com mensagem
 * clara no boot da aplicação em vez de um erro obscuro em runtime.
 */
const envSchema = z.object({
  DATABASE_URL: z.url({ error: "DATABASE_URL precisa ser uma URL válida do Postgres." }),
  SESSION_SECRET: z
    .string()
    .min(32, { error: "SESSION_SECRET precisa ter pelo menos 32 caracteres." }),
  APP_URL: z.url({ error: "APP_URL precisa ser uma URL válida." }).default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", z.treeifyError(parsed.error));
  throw new Error("Variáveis de ambiente inválidas. Veja .env.example.");
}

export const env = parsed.data;
