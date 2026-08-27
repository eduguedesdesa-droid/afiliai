# Módulo: Tracking

Links rastreáveis, cupons, cliques, sessões de atribuição e os resolvers de atribuição (cupom, link, link+cupom, lead).

**Status:** ainda não implementado — planejado para a Fase 2 do plano de implementação.

Ao implementar, seguir a convenção dos demais módulos: `service.ts` (regra de
negócio), `repository.ts` (acesso a dado via Prisma), `schema.ts` (validação
Zod dos inputs), `types.ts`. Nenhuma lógica de negócio deve viver em
componentes React ou route handlers — sempre chamando uma função daqui.
