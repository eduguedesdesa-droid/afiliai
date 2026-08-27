# Módulo: Auth

Cadastro, login/logout, sessão e recuperação de senha.

**Status:** implementado (Fase 0):

- `signupEmpresa` / `signupAfiliado` (`actions.ts`): criam o usuário +
  perfil (empresa dona + `CompanyMember` OWNER, ou `AffiliateProfile`
  global) numa transação, e já entram logado.
- `login` / `logout`: sessão via `src/lib/session.ts` (cookie assinado +
  registro revogável no banco). Mensagem de erro genérica ("e-mail ou senha
  inválidos") — nunca revela se o e-mail existe.
- `requestPasswordReset` / `resetPassword`: token de uso único
  (`PasswordResetToken`, hash do token no banco, expira em 1h), e-mail
  enviado via `sendEmail` (`src/lib/email.ts`) com o link — ver
  `emails.ts` para o template. Redefinir a senha derruba todas as sessões
  ativas do usuário (`destroyAllSessionsForUser`). `requestPasswordReset`
  sempre responde com a mesma mensagem de sucesso, exista ou não o e-mail.
- `emails.ts`: templates de e-mail do módulo (funções puras, sem I/O) —
  hoje só `passwordResetEmail`. Um futuro convite de membro de empresa ou
  verificação de e-mail entraria aqui do mesmo jeito.

Testado: `schemas.ts` (validação de cadastro/login/reset) e `emails.ts` têm
testes unitários (`schemas.test.ts`, `emails.test.ts`) — ver README.md da
raiz, seção Testes.

Ainda não implementado: convite de membro para uma empresa existente (hoje
só quem se cadastra vira OWNER — `CompanyMember.invitedAt`/`role` já
existem no schema para isso), verificação de e-mail no cadastro
(`User.emailVerifiedAt` existe no schema mas nada o preenche ainda), 2FA.
