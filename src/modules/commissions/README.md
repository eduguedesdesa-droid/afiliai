# Módulo: Comissões

Motor de cálculo de comissão, máquina de estados e histórico de mudança de status.

**Status:** ainda não implementado — planejado para a Fase 3 do plano de implementação.

Ao implementar, seguir a convenção dos demais módulos: `service.ts` (regra de
negócio), `repository.ts` (acesso a dado via Prisma), `schema.ts` (validação
Zod dos inputs), `types.ts`. Nenhuma lógica de negócio deve viver em
componentes React ou route handlers — sempre chamando uma função daqui.
