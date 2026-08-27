import path from "node:path";
import { defineConfig } from "vitest/config";

const emptyModule = path.resolve(import.meta.dirname, "./src/test/stubs/empty-module.ts");

/**
 * Config dos testes de integração (`pnpm test:integration`): batem num
 * Postgres real (ver README.md, seção Testes). Rodam sequenciais dentro de
 * cada arquivo (fileParallelism desligado) porque compartilham o mesmo
 * banco e cada teste começa truncando as tabelas — ver src/test/db-reset.ts.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
  resolve: {
    alias: [
      { find: /^@\//, replacement: path.resolve(import.meta.dirname, "./src") + "/" },
      { find: "server-only", replacement: emptyModule },
      { find: "client-only", replacement: emptyModule },
    ],
  },
});
