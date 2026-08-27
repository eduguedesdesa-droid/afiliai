import { NextRequest, NextResponse } from "next/server";
import { decodeSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session-token";

/**
 * Checagem OTIMISTA de autenticação (só o cookie, sem consulta ao banco —
 * Proxy roda em toda navegação/prefetch, então precisa ser rápido). A
 * checagem de verdade (papel, dados) acontece no DAL (`src/lib/dal.ts`),
 * chamado por cada layout/página protegida.
 */
const PROTECTED_PREFIXES = ["/empresa", "/afiliado", "/admin", "/escolher-contexto"];
const AUTH_ONLY_ROUTES = ["/login", "/cadastro"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const decoded = await decodeSessionCookie(cookieValue);
  const isAuthenticated = Boolean(decoded);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthOnly = AUTH_ONLY_ROUTES.includes(pathname);
  if (isAuthOnly && isAuthenticated) {
    return NextResponse.redirect(new URL("/escolher-contexto", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
