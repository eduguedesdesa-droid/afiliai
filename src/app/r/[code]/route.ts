import { NextResponse, type NextRequest } from "next/server";
import { registerClickAndAttribute, hashIp } from "@/modules/tracking/service";
import { resolveVisitorId, setVisitorCookie } from "@/lib/visitor";
import { env } from "@/lib/env";

/**
 * Endpoint público de redirecionamento rastreável — o link que um afiliado
 * compartilha (`{APP_URL}/r/{code}`). Registra o clique e a sessão de
 * atribuição do visitante, depois redireciona:
 * - campanha de LEAD → formulário público da campanha (/c/[campaignId]);
 * - campanha de VENDA → destinationUrl da campanha, ou o mesmo fallback
 *   público se a empresa não configurou um destino.
 * Código inválido ou afiliado não mais aprovado → redireciona para a home,
 * sem revelar o motivo.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { visitorId } = resolveVisitorId(request);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  const utm: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key.startsWith("utm_")) utm[key] = value;
  });

  const result = await registerClickAndAttribute({
    code,
    visitorId,
    ipHash: hashIp(ip ?? null),
    userAgent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
    utm: Object.keys(utm).length > 0 ? utm : null,
  });

  const destination = !result
    ? env.APP_URL
    : result.campaign.conversionType === "LEAD"
      ? `${env.APP_URL}/c/${result.campaign.id}`
      : (result.campaign.destinationUrl ?? `${env.APP_URL}/c/${result.campaign.id}`);

  const response = NextResponse.redirect(destination);
  setVisitorCookie(response, visitorId);
  return response;
}
