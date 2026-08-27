import "server-only";
import { cookies } from "next/headers";

const CONTEXT_COOKIE = "afiliai_context";

/**
 * Um usuário pode acumular múltiplos papéis (dono de uma empresa e afiliado
 * de outra, por exemplo). O "contexto ativo" define qual papel está sendo
 * usado na sessão de navegação atual — nunca é a única fonte de verdade:
 * o DAL sempre confere se o papel reivindicado aqui realmente pertence ao
 * usuário autenticado antes de conceder acesso a qualquer dado.
 */
export type ActiveContext =
  | { type: "PLATFORM_ADMIN" }
  | { type: "COMPANY_MEMBER"; companyId: string }
  | { type: "AFFILIATE" };

export async function setActiveContext(context: ActiveContext) {
  const cookieStore = await cookies();
  cookieStore.set(CONTEXT_COOKIE, JSON.stringify(context), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function getActiveContextCookie(): Promise<ActiveContext | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONTEXT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveContext;
  } catch {
    return null;
  }
}

export async function clearActiveContext() {
  const cookieStore = await cookies();
  cookieStore.delete(CONTEXT_COOKIE);
}

export function contextToPath(context: ActiveContext): string {
  switch (context.type) {
    case "PLATFORM_ADMIN":
      return "/admin";
    case "COMPANY_MEMBER":
      return "/empresa";
    case "AFFILIATE":
      return "/afiliado";
  }
}
