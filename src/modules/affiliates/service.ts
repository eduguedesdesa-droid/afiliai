import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// Módulo "Afiliados" — ver README.md desta pasta.

/**
 * Nome fixo da campanha auto-criada por empresa pra guardar afiliados
 * adicionados manualmente (fora do fluxo normal de solicitar/aprovar numa
 * campanha real). Nada na UI hoje deixa renomear uma campanha, então casar
 * por nome é seguro — se isso mudar no futuro, trocar por uma coluna própria
 * (ex.: `Campaign.isDefault`).
 */
const DEFAULT_CAMPAIGN_NAME = "Divulgação geral";

export type AddAffiliateManuallyInput = {
  companyId: string;
  /** Quem na empresa disparou a ação, só para o audit log — opcional pra manter a função fácil de testar isoladamente. */
  performedByUserId?: string;
  name: string;
  email: string;
  couponCode: string;
  phone: string | null;
  city: string | null;
  document: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  otherSocialUrl: string | null;
};

export type AddAffiliateManuallyResult =
  | { ok: true; isNewAccount: boolean; email: string; inviteToken: string | null }
  | { ok: false; error: "COUPON_CODE_TAKEN" };

/**
 * Empresa adiciona um afiliado diretamente (sem ele solicitar participação),
 * com um cupom já definido — ver src/modules/affiliates/actions.ts para a
 * validação de input e checagem de autorização (esta função assume que
 * `companyId` já foi verificado como pertencente ao usuário autenticado).
 *
 * - E-mail já cadastrado com perfil de afiliado: só entra na campanha padrão
 *   com o cupom novo. Dados de contato passados aqui (telefone, cidade,
 *   documento, redes sociais) são IGNORADOS nesse caso — não sobrescrevemos
 *   o perfil de uma conta que já existe (a pessoa é dona dos próprios dados,
 *   edita em /afiliado/perfil).
 * - E-mail já cadastrado mas sem perfil de afiliado (ex.: é dono de empresa):
 *   ganha o papel de afiliado além do que já tinha.
 * - E-mail novo: cria a conta (com uma senha aleatória que ninguém conhece)
 *   e devolve um token de convite — quem chama é responsável por mandar o
 *   e-mail com o link de definir senha (mesmo mecanismo de "esqueci minha
 *   senha", ver src/modules/auth/emails.ts).
 */
export async function addAffiliateManually(input: AddAffiliateManuallyInput): Promise<AddAffiliateManuallyResult> {
  const codeTaken = await prisma.coupon.findUnique({ where: { code: input.couponCode }, select: { id: true } });
  if (codeTaken) return { ok: false, error: "COUPON_CODE_TAKEN" };

  return prisma.$transaction(async (tx) => {
    let userId: string;
    let affiliateProfileId: string;
    let isNewAccount = false;

    const existingUser = await tx.user.findUnique({ where: { email: input.email }, select: { id: true } });

    if (existingUser) {
      userId = existingUser.id;
      const existingProfile = await tx.affiliateProfile.findUnique({ where: { userId }, select: { id: true } });

      if (existingProfile) {
        affiliateProfileId = existingProfile.id;
      } else {
        const createdProfile = await tx.affiliateProfile.create({
          data: { userId, displayName: input.name },
          select: { id: true },
        });
        affiliateProfileId = createdProfile.id;
        await tx.userRole.create({ data: { userId, role: "AFFILIATE" } });
      }
    } else {
      isNewAccount = true;
      // Ninguém conhece essa senha — a pessoa define a dela própria pelo
      // link de convite (token abaixo). Só existe pra satisfazer a coluna
      // NOT NULL até lá.
      const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
      const createdUser = await tx.user.create({
        data: { name: input.name, email: input.email, passwordHash, status: "ACTIVE", phone: input.phone },
        select: { id: true },
      });
      userId = createdUser.id;

      const createdProfile = await tx.affiliateProfile.create({
        data: {
          userId,
          displayName: input.name,
          document: input.document,
          city: input.city,
          instagramUrl: input.instagramUrl,
          tiktokUrl: input.tiktokUrl,
          otherSocialUrl: input.otherSocialUrl,
        },
        select: { id: true },
      });
      affiliateProfileId = createdProfile.id;

      await tx.userRole.create({ data: { userId, role: "AFFILIATE" } });
    }

    let campaign = await tx.campaign.findFirst({
      where: { companyId: input.companyId, name: DEFAULT_CAMPAIGN_NAME },
      select: { id: true },
    });
    if (!campaign) {
      campaign = await tx.campaign.create({
        data: {
          companyId: input.companyId,
          name: DEFAULT_CAMPAIGN_NAME,
          description:
            "Criada automaticamente ao adicionar um afiliado manualmente (Afiliados → Adicionar afiliado). Configure uma regra de recompensa aqui se quiser gerar comissão nessas vendas.",
          status: "ACTIVE",
          attributionMethod: "COUPON",
          approvalMode: "MANUAL",
        },
        select: { id: true },
      });
    }

    const campaignAffiliate = await tx.campaignAffiliate.upsert({
      where: { campaignId_affiliateProfileId: { campaignId: campaign.id, affiliateProfileId } },
      update: { status: "APPROVED", joinedAt: new Date() },
      create: { campaignId: campaign.id, affiliateProfileId, status: "APPROVED", joinedAt: new Date() },
      select: { id: true },
    });

    await tx.coupon.create({ data: { campaignAffiliateId: campaignAffiliate.id, code: input.couponCode } });

    let inviteToken: string | null = null;
    if (isNewAccount) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      // Prazo maior que o do "esqueci minha senha" (1h) — é um convite pra
      // gente que ainda não tem rotina nenhuma na plataforma, não uma
      // recuperação urgente de acesso.
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await tx.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
      inviteToken = rawToken;
    }

    await tx.auditLog.create({
      data: {
        companyId: input.companyId,
        userId: input.performedByUserId,
        action: "ADD_AFFILIATE_MANUALLY",
        entityType: "AffiliateProfile",
        entityId: affiliateProfileId,
      },
    });

    return { ok: true, isNewAccount, email: input.email, inviteToken };
  });
}
