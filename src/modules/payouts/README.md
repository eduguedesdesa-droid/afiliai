# Módulo: Pagamentos

Agrupamento de comissões aprovadas em lotes de pagamento (payouts) aos afiliados.

**Status:** implementado (Fase 5):

- `createPayout` (`actions.ts`): a empresa escolhe um afiliado e as
  comissões `APPROVED` que quer incluir num lote. Revalida no servidor que
  cada comissão está `APPROVED`, pertence a uma campanha da empresa
  autenticada e ainda não está em nenhum outro pagamento
  (`payoutItems: { none: {} }`) — nunca confia no que o formulário marcou.
- `markPayoutPaid`: marca o `Payout` como `PAID` e transiciona cada
  comissão incluída para `PAID` via `commissions.transitionCommissionStatus`
  (mesma máquina de estados central da Fase 3 — não duplica a regra).
- UI em `/empresa/payouts` (lista), `/empresa/payouts/novo` (escolher
  afiliado com saldo a receber) e `/novo/[affiliateProfileId]` (checklist de
  comissões), `/empresa/payouts/[id]` (detalhe + marcar como pago).

A marcação individual de uma comissão como paga (Fase 3, em
`/empresa/comissoes`) continua existindo em paralelo, para o caso de um
pagamento avulso que não precisa virar um lote.

Ainda não implementado: cancelar/editar um pagamento já criado, integração
com um provedor de pagamento real (hoje "pago" é sempre uma marcação
manual), múltiplas moedas.
