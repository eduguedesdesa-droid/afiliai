import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Módulo "Tracking" — ver README.md desta pasta.
// Implementado: geração de código único de cupom/link ao aprovar um afiliado
// numa campanha (Fase 1); endpoint /r/[code], captura de clique, sessão de
// atribuição e resolução de atribuição para leads (Fase 2).

function codeBaseFrom(displayName: string): string {
  const normalized = displayName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  return normalized || "AFILIADO";
}

async function uniqueCode(base: string, exists: (code: string) => Promise<boolean>): Promise<string> {
  let candidate = base;
  let attempts = 0;

  while (await exists(candidate)) {
    attempts += 1;
    if (attempts > 10) throw new Error("Não foi possível gerar um código único.");
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    candidate = `${base}${suffix}`;
  }

  return candidate;
}

export async function ensureCouponForCampaignAffiliate(campaignAffiliateId: string, displayName: string) {
  const existing = await prisma.coupon.findFirst({ where: { campaignAffiliateId } });
  if (existing) return existing;

  const code = await uniqueCode(codeBaseFrom(displayName), async (candidate) =>
    Boolean(await prisma.coupon.findUnique({ where: { code: candidate }, select: { id: true } }))
  );

  return prisma.coupon.create({ data: { campaignAffiliateId, code } });
}

export async function ensureAffiliateLinkForCampaignAffiliate(campaignAffiliateId: string, displayName: string) {
  const existing = await prisma.affiliateLink.findFirst({ where: { campaignAffiliateId } });
  if (existing) return existing;

  const code = await uniqueCode(codeBaseFrom(displayName), async (candidate) =>
    Boolean(await prisma.affiliateLink.findUnique({ where: { code: candidate }, select: { id: true } }))
  );

  return prisma.affiliateLink.create({ data: { campaignAffiliateId, code } });
}

/** Nunca armazenar IP em texto puro — apenas um hash, suficiente para detecção básica de abuso futura. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

type RegisterClickInput = {
  code: string;
  visitorId: string;
  ipHash: string | null;
  userAgent: string | null;
  referrer: string | null;
  utm: Record<string, string> | null;
};

/**
 * Chamado pelo endpoint público /r/[code]. Registra o clique, incrementa o
 * contador do link e atualiza a sessão de atribuição do visitante (last-
 * click dentro da empresa: o clique mais recente vale, respeitando a janela
 * de atribuição definida na campanha). Retorna a campanha para o endpoint
 * decidir para onde redirecionar, ou `null` se o código não existir ou o
 * afiliado não estiver mais aprovado na campanha.
 */
export async function registerClickAndAttribute(input: RegisterClickInput) {
  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code: input.code },
    include: { campaignAffiliate: { include: { campaign: true } } },
  });

  if (!affiliateLink || affiliateLink.campaignAffiliate.status !== "APPROVED") {
    return null;
  }

  const { campaign } = affiliateLink.campaignAffiliate;

  await prisma.click.create({
    data: {
      affiliateLinkId: affiliateLink.id,
      visitorId: input.visitorId,
      ipHash: input.ipHash,
      userAgent: input.userAgent,
      referrer: input.referrer,
      utm: input.utm ?? undefined,
    },
  });

  await prisma.affiliateLink.update({
    where: { id: affiliateLink.id },
    data: { clicksCount: { increment: 1 } },
  });

  const expiresAt = new Date(Date.now() + campaign.attributionWindowDays * 24 * 60 * 60 * 1000);

  await prisma.trackingSession.upsert({
    where: { companyId_visitorId: { companyId: campaign.companyId, visitorId: input.visitorId } },
    update: { affiliateLinkId: affiliateLink.id, lastTouchAt: new Date(), expiresAt },
    create: {
      companyId: campaign.companyId,
      visitorId: input.visitorId,
      affiliateLinkId: affiliateLink.id,
      expiresAt,
    },
  });

  return { campaign };
}

/**
 * Chamado pela página pública /c/[campaignId] ao receber um lead. Resolve
 * qual afiliado (se algum) deve receber o crédito, a partir da sessão de
 * atribuição do visitante — só atribui se a sessão ainda estiver dentro da
 * janela de atribuição e apontar para um link da MESMA campanha.
 */
export async function resolveAttributionForVisitor(companyId: string, visitorId: string, campaignId: string) {
  const session = await prisma.trackingSession.findUnique({
    where: { companyId_visitorId: { companyId, visitorId } },
    include: { affiliateLink: { include: { campaignAffiliate: true } } },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  if (!session.affiliateLink) return null;

  const { campaignAffiliate } = session.affiliateLink;
  if (campaignAffiliate.campaignId !== campaignId) return null;
  if (campaignAffiliate.status !== "APPROVED") return null;

  return {
    affiliateProfileId: campaignAffiliate.affiliateProfileId,
    campaignAffiliateId: campaignAffiliate.id,
    trackingSessionId: session.id,
  };
}
