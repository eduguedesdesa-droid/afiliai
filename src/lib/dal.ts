import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decodeSessionCookie, getSessionCookieValue } from "@/lib/session";
import { getActiveContextCookie, type ActiveContext } from "@/lib/active-context";

/**
 * Data Access Layer — todo acesso a dado protegido do sistema deve passar
 * por aqui. Centralizar a checagem de sessão/autorização evita que alguém
 * esqueça de validar em uma rota, action ou route handler nova.
 *
 * `verifySession`/`getCurrentUser` fazem a checagem SEGURA (consulta o
 * banco). `proxy.ts` faz apenas a checagem OTIMISTA (só o cookie) para
 * redirecionar a UI mais rápido — nunca é a única linha de defesa.
 */

export const verifySession = cache(async () => {
  const cookieValue = await getSessionCookieValue();
  const decoded = await decodeSessionCookie(cookieValue);

  if (!decoded?.sessionId) {
    redirect("/login");
  }

  const session = await prisma.session.findUnique({
    where: { id: decoded.sessionId },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    redirect("/login");
  }

  return { sessionId: session.id, userId: session.userId };
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      roles: {
        select: {
          id: true,
          role: true,
          companyId: true,
          company: { select: { id: true, name: true, slug: true, status: true } },
        },
      },
      affiliateProfile: { select: { id: true, displayName: true, status: true } },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    redirect("/login");
  }

  return user;
});

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

/** Deriva os contextos (papéis) disponíveis para o usuário a partir do banco. */
export function availableContexts(user: CurrentUser): ActiveContext[] {
  return user.roles.map((r) => {
    if (r.role === "PLATFORM_ADMIN") return { type: "PLATFORM_ADMIN" as const };
    if (r.role === "AFFILIATE") return { type: "AFFILIATE" as const };
    return { type: "COMPANY_MEMBER" as const, companyId: r.companyId as string };
  });
}

function sameContext(a: ActiveContext, b: ActiveContext): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "COMPANY_MEMBER" && b.type === "COMPANY_MEMBER") {
    return a.companyId === b.companyId;
  }
  return true;
}

/**
 * Garante que o usuário autenticado realmente tem o papel exigido por uma
 * área do produto (ex.: layout de /empresa exige COMPANY_MEMBER). Nunca
 * confia apenas no cookie de contexto — sempre cruza com os papéis reais
 * do usuário carregados do banco.
 */
export async function requireContext(expectedType: ActiveContext["type"]) {
  const user = await getCurrentUser();
  const contexts = availableContexts(user);
  const cookieContext = await getActiveContextCookie();

  const matchFromCookie =
    cookieContext && contexts.some((c) => sameContext(c, cookieContext)) ? cookieContext : null;

  const resolved =
    matchFromCookie ?? contexts.find((c) => c.type === expectedType) ?? null;

  if (!resolved || resolved.type !== expectedType) {
    redirect("/escolher-contexto");
  }

  // Empresa suspensa pelo admin da plataforma: acesso bloqueado de verdade,
  // não só escondido na navegação — checado aqui porque toda página de
  // /empresa passa por requireContext("COMPANY_MEMBER").
  if (resolved.type === "COMPANY_MEMBER") {
    const role = user.roles.find((r) => r.role === "COMPANY_MEMBER" && r.companyId === resolved.companyId);
    if (role?.company && role.company.status !== "ACTIVE") {
      redirect("/empresa-suspensa");
    }
  }

  return { user, context: resolved };
}
