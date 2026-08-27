import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Alguns ambientes de desenvolvimento (ex.: o sandbox usado por agentes de
// IA neste projeto) já vêm com um Chromium pré-instalado numa revisão que
// pode não bater com a que @playwright/test espera por padrão — nesse caso
// apontar pro binário direto evita "Executable doesn't exist" sem precisar
// baixar nada. Onde esse caminho não existir (CI, máquina de um dev
// comum), `pnpm exec playwright install chromium` resolve normalmente e o
// Playwright usa a revisão que ele mesmo baixou.
const SANDBOX_CHROMIUM_PATH = "/opt/pw-browsers/chromium";
const executablePath = existsSync(SANDBOX_CHROMIUM_PATH) ? SANDBOX_CHROMIUM_PATH : undefined;

/**
 * Testes E2E (`pnpm e2e`) — navegador de verdade contra o app rodando de
 * verdade, num banco dedicado (E2E_DATABASE_URL, ver scripts/with-db.mjs e
 * scripts/e2e-seed.ts). Roda um worker só: os specs compartilham o mesmo
 * servidor/banco pela duração da suíte inteira (sem truncar entre testes —
 * cada um usa dados com nome único, ver e2e/helpers/unique.ts), então
 * paralelismo real exigiria isolamento que não vale a pena para o tamanho
 * atual da suíte.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      APP_URL: BASE_URL,
      // Ver o comentário em src/lib/rate-limit.ts — só o servidor de E2E
      // define isso.
      E2E_TESTING: "1",
    },
  },
});
