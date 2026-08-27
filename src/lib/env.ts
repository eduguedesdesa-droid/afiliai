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
  // Ausente = modo dev: src/lib/email.ts loga em vez de enviar de verdade
  // (ver README.md, seção E-mail transacional). Presente = envia via Resend.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z
    .string()
    .min(1, { error: "EMAIL_FROM não pode ser vazio." })
    // Sender de teste do Resend — funciona sem domínio verificado, mas só
    // entrega para o e-mail da própria conta Resend. Trocar por um remetente
    // do domínio verificado da empresa antes de ir a produção.
    .default("Afiliai <onboarding@resend.dev>"),
  // Só definida pelo servidor de E2E (playwright.config.ts) — desliga o
  // rate limit (src/lib/rate-limit.ts), que senão bloquearia a própria
  // suíte (várias specs fazem login/cadastro do "mesmo IP", localhost).
  // NUNCA definir isso fora desse contexto.
  E2E_TESTING: z.string().optional(),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  E2E_TESTING: process.env.E2E_TESTING,
});

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", z.treeifyError(parsed.error));
  throw new Error("Variáveis de ambiente inválidas. Veja .env.example.");
}

export const env = parsed.data;
