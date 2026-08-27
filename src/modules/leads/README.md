# Módulo: Leads

Captura de leads via formulário de campanha e atribuição ao afiliado.

**Status:** implementado (Fase 2):

- Página pública `/c/[campaignId]` (campanhas com `conversionType=LEAD`)
  com formulário (nome, e-mail, telefone) — destino do `/r/[code]` para
  esse tipo de campanha.
- `submitLead` (`actions.ts`): valida o formulário, resolve a atribuição a
  partir da sessão de atribuição do visitante (`tracking.resolveAttributionForVisitor`)
  e cria o `Lead`. A atribuição nunca vem de um campo do formulário — só da
  sessão server-side, para não poder ser forjada.
- `updateLeadStatus`: transição manual de status (NEW → CONTACTED →
  QUALIFIED → LOST) pela empresa, em `/empresa/leads`.

Testado: `submitLeadSchema` tem testes unitários (`schemas.test.ts`).

Ainda não implementado: conversão de lead em venda (`status=CONVERTED` é
setado pela Fase 3, ao registrar a venda vinculada ao lead), campos
customizados por campanha (`Lead.customFields` já existe no schema).
