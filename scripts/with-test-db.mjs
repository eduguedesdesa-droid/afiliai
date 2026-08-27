#!/usr/bin/env node
// Roda um comando com DATABASE_URL trocada para TEST_DATABASE_URL — usado
// por `pnpm test:integration` para nunca rodar `prisma migrate deploy` /
// TRUNCATE contra o banco de desenvolvimento por engano. Ver README.md,
// seção Testes.
import "dotenv/config";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "TEST_DATABASE_URL não está definida.\n" +
      "Configure em .env (veja .env.example) apontando para um banco Postgres " +
      "dedicado a testes — os testes de integração TRUNCAM todas as tabelas, " +
      "nunca aponte para o banco de desenvolvimento."
  );
  process.exit(1);
}

const command = process.argv.slice(2).join(" ");
if (!command) {
  console.error("Uso: node scripts/with-test-db.mjs \"<comando>\"");
  process.exit(1);
}

const result = spawnSync(command, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 1);
