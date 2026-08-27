# Módulo: Comissões

Motor de cálculo de comissão, máquina de estados e histórico de mudança de status.

**Status:** implementado (Fase 3):

- `createCommissionForSale` (`service.ts`): calcula o valor da comissão a
  partir da regra de recompensa ativa da campanha (percentual do valor da
  venda, ou valor fixo) e cria a comissão com status inicial `PENDING` ou
  `APPROVED`, conforme `Campaign.approvalMode`.
- `transitionCommissionStatus`: único ponto do sistema que altera
  `Commission.status` — valida a transição contra uma tabela de estados
  permitidos (`PENDING → APPROVED/REJECTED/CANCELLED`, `APPROVED →
  PAID/CANCELLED`, os demais terminais) e grava sempre um
  `CommissionStatusHistory`. `PENDING → CANCELLED` existe especificamente
  para `cancelCommissionsForSale` (venda cancelada antes de a comissão ser
  aprovada/rejeitada) — descoberto faltando ao escrever os testes de
  integração, ver `service.integration.test.ts`.
- `cancelCommissionsForSale`: chamado quando uma venda é cancelada — cancela
  as comissões dessa venda que ainda podem ser canceladas.
- `updateCommissionStatus` (`actions.ts`): Server Action da UI
  (`/empresa/comissoes`) — confere que a comissão pertence a uma campanha da
  empresa autenticada antes de aceitar a transição.

Testado: `computeCommissionAmountCents` e `ALLOWED_TRANSITIONS` têm testes
unitários (`service.test.ts`); `createCommissionForSale`,
`transitionCommissionStatus` e `cancelCommissionsForSale` têm testes de
integração contra Postgres real (`service.integration.test.ts`) — ver
README.md da raiz, seção Testes.

Ainda não implementado: aprovação automática em lote, notificação ao
afiliado quando o status muda.
