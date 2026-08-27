import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Cookie anônimo de longa duração usado para identificar um visitante entre
 * o clique no link (/r/[code]) e uma conversão posterior (lead ou venda)
 * dentro da janela de atribuição da campanha. Não é o cookie de sessão de
 * autenticação (`afiliai_session`) — este nunca identifica um usuário logado.
 */
export const VISITOR_COOKIE_NAME = "afiliai_visitor";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 ano

/** Lê o visitorId do cookie da requisição, gerando um novo se ainda não existir. */
export function resolveVisitorId(req: NextRequest): { visitorId: string; isNew: boolean } {
  const existing = req.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (existing) return { visitorId: existing, isNew: false };
  return { visitorId: randomUUID(), isNew: true };
}

export function setVisitorCookie(response: NextResponse, visitorId: string) {
  response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}
