# Módulo: Tracking

Links rastreáveis, cupons, cliques, sessões de atribuição e os resolvers de
atribuição (cupom, link, link+cupom, lead).

**Status:** parcialmente implementado — `service.ts` gera o código único de
cupom/link quando um afiliado é aprovado numa campanha (chamado a partir do
módulo `affiliates`).

Ainda não implementado (Fase 2): o endpoint público `/r/[code]` de
redirecionamento, captura de clique (`Click`), criação de `TrackingSession`
por visitante/cookie, aplicação de cupom em checkout, captura de lead via
formulário público, e os resolvers de atribuição que ligam uma venda de
volta ao afiliado certo dentro da janela de atribuição da campanha.
