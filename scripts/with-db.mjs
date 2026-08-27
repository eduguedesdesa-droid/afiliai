#!/usr/bin/env node
// Roda um comando com DATABASE_URL trocada pela env var indicada — usado por
// `pnpm test:integration` (TEST_DATABASE_URL) e `pnpm e2e` (E2E_DATABASE_URL)
// para nunca rodar `prisma migrate deploy` / TRUNCATE contra o banco de
// desenvolvimento por engano. Ver README.md, seção Testes.
import "dotenv/config";
import { spawnSync } from "node:child_process";

const [envVarName, ...commandParts] = process.argv.slice(2);
const command = commandParts.join(" ");

if (!envVarName || !command) {
  console.error('Uso: node scripts/with-db.mjs <NOME_DA_ENV_VAR> "<comando>"');
  process.exit(1);
}

const databaseUrl = process.env[envVarName];

if (!databaseUrl) {
  console.error(
    `${envVarName} não está definida.\n` +
      "Configure em .env (veja .env.example) apontando para um banco Postgres " +
      "dedicado — esse comando TRUNCA todas as tabelas, nunca aponte para o " +
      "banco de desenvolvimento."
  );
  process.exit(1);
}

const result = spawnSync(command, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 1);
