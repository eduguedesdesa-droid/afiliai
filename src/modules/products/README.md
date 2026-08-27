# Módulo: Produtos

CRUD de produtos/serviços da empresa.

**Status:** implementado (Fase 1) — criar produto e ativar/desativar, em
`actions.ts` (`createProduct`, `toggleProductActive`), validado com
`schemas.ts`. UI em `/empresa/produtos`.

Testado: `createProductSchema` tem testes unitários (`schemas.test.ts`),
incluindo a conversão de preço em reais (string) para centavos.

Ainda não implementado: edição de nome/preço, exclusão, vínculo explícito de
produto a mais de uma campanha via UI (o schema em `CampaignProduct` já
suporta).
