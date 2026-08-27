import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { encryptSessionCookie, decodeSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session-token";

export { decodeSessionCookie, SESSION_COOKIE_NAME };

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

/**
 * O JWT no cookie carrega apenas o id da sessão (nunca dados sensíveis). A
 * verdade sobre a sessão — usuário, validade, revogação — vive na tabela
 * `sessions` do banco. Isso permite "sair de todos os dispositivos" e
 * revogação imediata, algo que um JWT puro (sem estado) não oferece.
 */
export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ipHash?: string | null }
) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipHash: meta?.ipHash ?? null,
    },
    select: { id: true },
  });

  const token = await encryptSessionCookie({ sessionId: session.id }, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return session.id;
}

export async function getSessionCookieValue() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

/** Encerra a sessão atual: apaga do banco (revogação real) e limpa o cookie. */
export async function destroySession() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const decoded = await decodeSessionCookie(cookieValue);

  if (decoded?.sessionId) {
    await prisma.session.delete({ where: { id: decoded.sessionId } }).catch(() => {
      // já pode ter expirado/sido removida — não é um erro para o usuário
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Revoga todas as sessões de um usuário — usado, por exemplo, após reset de senha. */
export async function destroyAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
