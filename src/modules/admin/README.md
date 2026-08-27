# Módulo: Admin

Ações exclusivas do admin da plataforma sobre empresas e usuários de
qualquer conta — não existia no esqueleto inicial de módulos porque a
Fase 0 só previa o dashboard do admin; o restante do painel entrou na
Fase 5, junto com pagamentos.

**Status:** implementado:

- `suspendCompany` / `reactivateCompany`: muda `Company.status`. Uma empresa
  suspensa é bloqueada de verdade — `requireContext("COMPANY_MEMBER")`
  (`src/lib/dal.ts`) checa o status da empresa a cada acesso e redireciona
  para `/empresa-suspensa`, não é só uma flag cosmética escondida na
  navegação.
- `suspendUser` / `reactivateUser`: muda `User.status`. Suspender derruba
  todas as sessões ativas do usuário na hora (`destroyAllSessionsForUser`)
  e bloqueia login (`login`, em `src/modules/auth/actions.ts`, já recusa
  contas não `ACTIVE`). Um admin nunca pode suspender a própria conta.
- UI em `/admin/empresas` e `/admin/usuarios`.

Ainda não implementado: moderação de conteúdo (campanhas/afiliados
individuais), motivo/nota ao suspender, notificação por e-mail da empresa
ou usuário afetado.
