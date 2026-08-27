# Módulo: Produtos

CRUD de produtos/serviços da empresa.

**Status:** implementado (Fase 1) — criar produto e ativar/desativar, em
`actions.ts` (`createProduct`, `toggleProductActive`), validado com
`schemas.ts`. UI em `/empresa/produtos`.

Ainda não implementado: edição de nome/preço, exclusão, vínculo explícito de
produto a mais de uma campanha via UI (o schema em `CampaignProduct` já
suporta).
