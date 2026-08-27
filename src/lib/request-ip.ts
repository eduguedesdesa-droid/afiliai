import "server-only";
import { headers } from "next/headers";

/**
 * IP do requisitante numa Server Action (que, ao contrário de um Route
 * Handler, não recebe um `NextRequest` — só `headers()`). Usado como parte
 * da chave de rate limit em `src/modules/auth/actions.ts`.
 *
 * `x-forwarded-for` é definido pelo proxy/load balancer na frente do app —
 * confiável em produção atrás de um host gerenciado (Vercel e afins sempre
 * definem/reescrevem esse header), mas forjável por quem fala direto com o
 * processo Node (ex.: sem proxy na frente, em dev). Aceitável para rate
 * limit (defesa em profundidade, não a única barreira) — não usar isto para
 * decisões de autorização.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  return ip || "unknown";
}
