import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

/**
 * Módulo "puro" (sem `next/headers`, sem Prisma) para codificar/decodificar
 * o token de sessão. Existe separado de `session.ts` de propósito: é o único
 * pedaço da lógica de sessão que o `proxy.ts` pode importar com segurança —
 * qualquer coisa que toque o banco não deve rodar a cada requisição no Proxy.
 */
export const SESSION_COOKIE_NAME = "afiliai_session";

const encodedSecret = new TextEncoder().encode(env.SESSION_SECRET);

type SessionCookiePayload = {
  sessionId: string;
};

export async function encryptSessionCookie(payload: SessionCookiePayload, expiresAt: Date) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(encodedSecret);
}

/**
 * Verificação apenas de assinatura/formato — NÃO consulta o banco. Use isto
 * só para checagens otimistas (ex.: proxy.ts). Para autorização de verdade,
 * use `verifySession()` do DAL, que confirma a sessão no banco.
 */
export async function decodeSessionCookie(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify<SessionCookiePayload>(cookieValue, encodedSecret, {
      algorithms: ["HS256"],
    });
    if (typeof payload.sessionId !== "string") return null;
    return { sessionId: payload.sessionId };
  } catch {
    return null;
  }
}
