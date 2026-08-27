# Módulo: Vendas

Registro de vendas (conversões), idempotência por pedido externo.

**Status:** implementado (Fase 3):

- `createSale` (`actions.ts`): registra uma venda manualmente, resolvendo o
  afiliado conforme o método de atribuição da campanha (cupom digitado,
  afiliado escolhido manualmente para LINK, ou lead com afiliado atribuído
  para LEAD — que também marca o lead como `CONVERTED`), e dispara
  `createCommissionForSale` (módulo `commissions`).
- Idempotência: `@@unique([companyId, externalOrderId])` no schema —
  tentar registrar duas vezes o mesmo `externalOrderId` retorna erro de
  validação em vez de duplicar a venda.
- `cancelSale`: cancela a venda e propaga o cancelamento para as comissões
  ainda canceláveis (`cancelCommissionsForSale`).

Ainda não implementado: webhook de e-commerce para registrar vendas
automaticamente (hoje é sempre lançamento manual pela empresa), edição de
uma venda já registrada.
