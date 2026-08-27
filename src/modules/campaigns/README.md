# Módulo: Campanhas

CRUD de campanhas, regras de recompensa (reward rules), produtos vinculados.

**Status:** implementado (Fase 1) — criar campanha, mudar status
(rascunho → ativa → pausada/encerrada) e definir a regra de recompensa
(percentual ou valor fixo) em `actions.ts`. UI em `/empresa/campanhas`.

Ainda não implementado: vínculo de produtos específicos (hoje toda campanha
vale para todos os produtos), múltiplas regras de recompensa por campanha
(tiers/condições — o schema já suporta via `RewardRule.config`), edição dos
demais campos após a criação.
