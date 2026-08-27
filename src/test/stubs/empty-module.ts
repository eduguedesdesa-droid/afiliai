// Stub para `import "server-only"` / `import "client-only"` sob Vitest.
//
// Esses pacotes não são dependências reais do projeto — funcionam em
// produção só porque o bundler do Next.js resolve `server-only` /
// `client-only` para um stub interno que lança se importado do lado
// errado. O Vitest não conhece esse resolvedor especial, então
// `vitest.config.ts` e `vitest.integration.config.ts` apontam essas
// duas specifiers para este arquivo (que não faz nada) via alias.
export {};
