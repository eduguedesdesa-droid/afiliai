import "dotenv/config";

// Alguns módulos testados (ex.: src/lib/session-token.ts) importam
// src/lib/env.ts, que valida process.env no momento do import e lança se
// faltar algo. `dotenv/config` carrega o `.env` local (se existir) sem
// sobrescrever variáveis já definidas — em CI elas já vêm do próprio
// workflow (ver .github/workflows/ci.yml).
