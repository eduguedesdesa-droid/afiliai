# Módulo: Tracking

Links rastreáveis, cupons, cliques, sessões de atribuição e os resolvers de
atribuição (cupom, link, link+cupom, lead).

**Status:** implementado (Fase 1 e 2):

- Geração de código único de cupom/link ao aprovar um afiliado numa campanha
  (`ensureCouponForCampaignAffiliate`, `ensureAffiliateLinkForCampaignAffiliate`).
- Endpoint público `GET /r/[code]` (`src/app/r/[code]/route.ts`): resolve o
  link, registra o clique (`Click`), incrementa `AffiliateLink.clicksCount`
  e faz upsert da `TrackingSession` do visitante (cookie `afiliai_visitor`).
- **Regra de atribuição: last-click por empresa.** Cada clique num link de
  qualquer afiliado da mesma empresa sobrescreve a sessão de atribuição do
  visitante (`affiliateLinkId` + `expiresAt` recalculado pela
  `attributionWindowDays` da campanha do clique mais recente). Documentado
  aqui porque é uma decisão de produto, não só técnica — ver risco
  correspondente no plano de arquitetura original.
- `resolveAttributionForVisitor(companyId, visitorId, campaignId)`: usado
  pela captura de lead (`src/modules/leads/actions.ts`) e pela página
  pública de fallback (`src/app/c/[campaignId]`) para decidir se/qual
  afiliado recebe o crédito, validando que a sessão não expirou e que
  aponta para a mesma campanha.

Testado: `registerClickAndAttribute` e `resolveAttributionForVisitor` têm
testes de integração contra Postgres real (`service.integration.test.ts`) —
clique/contador/last-click, rejeição para afiliado não aprovado ou empresa
suspensa, expiração e campanha errada na resolução de atribuição. Ver
README.md da raiz, seção Testes.

Ainda não implementado: aplicação automática de cupom em checkout externo
(depende de integração com a loja/e-commerce da empresa — fora do escopo até
haver um alvo de integração real), detecção de fraude/cliques abusivos.
