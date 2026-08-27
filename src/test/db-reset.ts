import { prisma } from "@/lib/prisma";

// Ordem não importa — TRUNCATE ... CASCADE cuida das dependências. Lista
// mantida em paralelo aos `@@map(...)` de prisma/schema.prisma; um teste de
// integração que falhar com "relation does not exist" é o sinal de que essa
// lista ficou desatualizada.
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

/**
 * Limpa todo o banco de testes de integração. Chamar em `beforeEach` (não
 * `beforeAll`) para que cada teste comece de um estado zerado e independente
 * dos demais — ver vitest.integration.config.ts (fileParallelism: false).
 */
export async function resetDatabase() {
  const tables = ALL_TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
}
