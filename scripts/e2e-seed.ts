import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "../e2e/helpers/e2e-admin";

/**
 * Prepara o banco de E2E antes de `playwright test` rodar: zera tudo e cria
 * só o que os testes não conseguem criar sozinhos pela UI — hoje, o único
 * caso é um admin da plataforma (não existe cadastro público pra esse
 * papel). Cada spec cria o resto (empresa, afiliado, campanha...) do jeito
 * que um usuário real criaria, com e-mails únicos por execução — ver
 * e2e/helpers/unique.ts.
 *
 * Rodar via `pnpm e2e` (nunca direto — precisa de DATABASE_URL apontando
 * pro banco de E2E, ver scripts/with-db.mjs).
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ALL_TABLES = [
  "audit_logs",
  "payout_items",
  "payouts",
  "commission_status_history",
  "commissions",
  "sales",
  "customers",
  "leads",
  "clicks",
  "tracking_sessions",
  "coupons",
  "affiliate_links",
  "campaign_affiliates",
  "reward_rules",
  "campaign_products",
  "campaigns",
  "products",
  "affiliate_characteristics",
  "affiliate_profiles",
  "company_members",
  "password_reset_tokens",
  "sessions",
  "user_roles",
  "companies",
  "users",
];

async function main() {
  console.log("Preparando banco de E2E...");

  const tables = ALL_TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);

  const passwordHash = await bcrypt.hash(E2E_ADMIN_PASSWORD, 12);
  const admin = await prisma.user.create({
    data: { email: E2E_ADMIN_EMAIL, name: "Admin E2E", passwordHash, status: "ACTIVE" },
  });
  await prisma.userRole.create({ data: { userId: admin.id, role: "PLATFORM_ADMIN" } });

  console.log(`Banco de E2E pronto. Admin: ${E2E_ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
