// Credenciais do admin de plataforma criado por scripts/e2e-seed.ts antes
// da suíte rodar. Módulo separado (sem side effects) de propósito — nunca
// importar scripts/e2e-seed.ts direto de um spec, ele executa TRUNCATE ao
// ser importado.
export const E2E_ADMIN_EMAIL = "e2e-admin@afiliai.local";
export const E2E_ADMIN_PASSWORD = "SenhaE2E123!";
