import path from "node:path";
import { defineConfig } from "vitest/config";

const emptyModule = path.resolve(import.meta.dirname, "./src/test/stubs/empty-module.ts");

/**
 * Config dos testes unitários (`pnpm test`): rápidos, sem banco. Testes que
 * precisam de Postgres de verdade vivem em `*.integration.test.ts` e rodam
 * sob `vitest.integration.config.ts` (`pnpm test:integration`).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts", "node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: [
      { find: /^@\//, replacement: path.resolve(import.meta.dirname, "./src") + "/" },
      { find: "server-only", replacement: emptyModule },
      { find: "client-only", replacement: emptyModule },
    ],
  },
});
