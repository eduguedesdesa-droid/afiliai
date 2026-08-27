import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Módulo "Tracking" — ver README.md desta pasta.
// Implementado até aqui: geração de código único de cupom/link ao aprovar um
// afiliado numa campanha. O restante (endpoint /r/[code], captura de clique,
// sessão de atribuição, resolvers de atribuição) é Fase 2.

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
