# Módulo: Comissões

Motor de cálculo de comissão, máquina de estados e histórico de mudança de status.

**Status:** implementado (Fase 3):

- `createCommissionForSale` (`service.ts`): calcula o valor da comissão a
  partir da regra de recompensa ativa da campanha (percentual do valor da
  venda, ou valor fixo) e cria a comissão com status inicial `PENDING` ou
  `APPROVED`, conforme `Campaign.approvalMode`.
- `transitionCommissionStatus`: único ponto do sistema que altera
  `Commission.status` — valida a transição contra uma tabela de estados
  permitidos (`PENDING → APPROVED/REJECTED`, `APPROVED → PAID/CANCELLED`,
  os demais terminais) e grava sempre um `CommissionStatusHistory`.
- `cancelCommissionsForSale`: chamado quando uma venda é cancelada — cancela
  as comissões dessa venda que ainda podem ser canceladas.
- `updateCommissionStatus` (`actions.ts`): Server Action da UI
  (`/empresa/comissoes`) — confere que a comissão pertence a uma campanha da
  empresa autenticada antes de aceitar a transição.

Ainda não implementado: aprovação automática em lote, notificação ao
afiliado quando o status muda.
