# Módulo: Empresas

Perfil da empresa, onboarding, configurações do tenant.

**Status:** parcialmente implementado — perfil de contato da empresa
(`updateCompanyProfile`, em `actions.ts` + `schemas.ts`): telefone, e-mail de
contato, cidade, CNPJ (reaproveita `Company.document`, já existente) e redes
sociais (Instagram, TikTok, outra). UI em `/empresa/perfil`, com um aviso
dispensável no dashboard (`src/components/dashboard/profile-prompt-banner.tsx`)
convidando a preencher quando a cidade ainda não foi informada.

Ainda não implementado: onboarding, demais configurações do tenant (plano,
segmento editável pela própria empresa, etc.). `service.ts` segue vazio —
`updateCompanyProfile` é simples o bastante pra viver direto em `actions.ts`,
seguindo o padrão de `modules/products`.
