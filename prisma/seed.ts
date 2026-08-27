import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/**
 * Popula o banco local de desenvolvimento com um cenário de ponta a ponta:
 * uma empresa (Loja XYZ), uma campanha ("Indique e Ganhe"), um afiliado
 * (João, cupom JOAO10) e 10 vendas confirmadas — o mesmo exemplo usado na
 * definição do produto (10 vendas, R$5.000 em receita, 10% de comissão,
 * R$500 gerados). Também cria um admin da plataforma.
 *
 * Rodar com: pnpm db:seed
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = "Senha123!";

async function upsertUser(email: string, name: string) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, status: "ACTIVE", emailVerifiedAt: new Date() },
  });
}

/**
 * companyId nulo não forma uma chave composta confiável para upsert (o
 * Postgres não trata NULL como igual a NULL em índices únicos), então
 * papéis globais (PLATFORM_ADMIN, AFFILIATE) usam find-or-create manual.
 */
async function ensureGlobalRole(userId: string, role: "PLATFORM_ADMIN" | "AFFILIATE") {
  const existing = await prisma.userRole.findFirst({ where: { userId, role, companyId: null } });
  if (existing) return existing;
  return prisma.userRole.create({ data: { userId, role } });
}

async function main() {
  console.log("Seeding banco de desenvolvimento...");

  // --- Admin da plataforma ---------------------------------------------------
  const admin = await upsertUser("admin@afiliai.com", "Admin Afiliai");
  await ensureGlobalRole(admin.id, "PLATFORM_ADMIN");

  // --- Empresa: Loja XYZ -------------------------------------------------------
  const ownerUser = await upsertUser("empresa@demo.afiliai.com", "Dona da Loja XYZ");

  const company = await prisma.company.upsert({
    where: { slug: "loja-xyz" },
    update: {},
    create: { name: "Loja XYZ", slug: "loja-xyz", segment: "Varejo físico", plan: "trial" },
  });

  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: ownerUser.id } },
    update: {},
    create: { companyId: company.id, userId: ownerUser.id, role: "OWNER", status: "ACTIVE", joinedAt: new Date() },
  });

  await prisma.userRole.upsert({
    where: { userId_role_companyId: { userId: ownerUser.id, role: "COMPANY_MEMBER", companyId: company.id } },
    update: {},
    create: { userId: ownerUser.id, role: "COMPANY_MEMBER", companyId: company.id },
  });

  // --- Campanha: "Indique e Ganhe" ---------------------------------------------
  let campaign = await prisma.campaign.findFirst({
    where: { companyId: company.id, name: "Indique e Ganhe" },
  });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        companyId: company.id,
        name: "Indique e Ganhe",
        description: "Campanha de indicação para clientes da loja física.",
        status: "ACTIVE",
        attributionMethod: "COUPON",
        conversionType: "SALE",
        approvalMode: "MANUAL",
        startDate: new Date(),
        attributionWindowDays: 30,
      },
    });
  }

  let rewardRule = await prisma.rewardRule.findFirst({ where: { campaignId: campaign.id } });
  if (!rewardRule) {
    rewardRule = await prisma.rewardRule.create({
      data: { campaignId: campaign.id, rewardType: "PERCENTAGE", value: 10, priority: 0 },
    });
  }

  // --- Afiliado: João, cupom JOAO10 --------------------------------------------
  const affiliateUser = await upsertUser("afiliado@demo.afiliai.com", "João Afiliado");

  const affiliateProfile = await prisma.affiliateProfile.upsert({
    where: { userId: affiliateUser.id },
    update: {},
    create: { userId: affiliateUser.id, displayName: "João" },
  });

  await ensureGlobalRole(affiliateUser.id, "AFFILIATE");

  const campaignAffiliate = await prisma.campaignAffiliate.upsert({
    where: { campaignId_affiliateProfileId: { campaignId: campaign.id, affiliateProfileId: affiliateProfile.id } },
    update: { status: "APPROVED", joinedAt: new Date() },
    create: {
      campaignId: campaign.id,
      affiliateProfileId: affiliateProfile.id,
      status: "APPROVED",
      joinedAt: new Date(),
    },
  });

  const coupon = await prisma.coupon.upsert({
    where: { code: "JOAO10" },
    update: {},
    create: { campaignAffiliateId: campaignAffiliate.id, code: "JOAO10", active: true },
  });

  // --- 10 vendas de R$500 cada (R$5.000 no total, 10% => R$500 de comissão) -----
  const existingSales = await prisma.sale.count({
    where: { campaignId: campaign.id, affiliateProfileId: affiliateProfile.id },
  });

  if (existingSales === 0) {
    for (let i = 1; i <= 10; i++) {
      const sale = await prisma.sale.create({
        data: {
          companyId: company.id,
          campaignId: campaign.id,
          affiliateProfileId: affiliateProfile.id,
          couponId: coupon.id,
          attributionMethod: "COUPON",
          grossAmountCents: 50000n, // R$ 500,00
          externalOrderId: `SEED-ORDER-${i}`,
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      const finalStatus = i <= 8 ? "PAID" : "APPROVED";

      const commission = await prisma.commission.create({
        data: {
          saleId: sale.id,
          campaignAffiliateId: campaignAffiliate.id,
          rewardRuleId: rewardRule.id,
          amountCents: 5000n, // R$ 50,00 (10% de R$500)
          type: "PERCENTAGE",
          status: finalStatus,
        },
      });

      await prisma.commissionStatusHistory.createMany({
        data: [
          { commissionId: commission.id, fromStatus: null, toStatus: "PENDING", reason: "Comissão criada a partir da venda." },
          {
            commissionId: commission.id,
            fromStatus: "PENDING",
            toStatus: "APPROVED",
            changedByUserId: ownerUser.id,
            reason: "Aprovada pela empresa.",
          },
          ...(finalStatus === "PAID"
            ? [
                {
                  commissionId: commission.id,
                  fromStatus: "APPROVED" as const,
                  toStatus: "PAID" as const,
                  changedByUserId: ownerUser.id,
                  reason: "Pagamento processado.",
                },
              ]
            : []),
        ],
      });
    }
  }

  console.log("Seed concluído.");
  console.log("");
  console.log(`Contas de teste (senha para todas: ${DEV_PASSWORD}):`);
  console.log("  Admin da plataforma:  admin@afiliai.com");
  console.log("  Empresa (Loja XYZ):   empresa@demo.afiliai.com");
  console.log("  Afiliado (João):      afiliado@demo.afiliai.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
