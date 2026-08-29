# Módulo: Afiliados

Convite e cadastro de afiliados numa empresa, elegibilidade em campanhas.

**Status:** parcialmente implementado (Fase 1) — fluxo de autoatendimento:
o afiliado solicita participação numa campanha ativa
(`requestToJoinCampaign`) e a empresa aprova ou rejeita
(`respondToJoinRequest`, em `actions.ts`), que dispara a geração de
cupom/link (ver módulo `tracking`). UI em `/afiliado/campanhas-disponiveis`,
`/afiliado/minhas-campanhas` e `/empresa/afiliados`.

Ainda não implementado: convite direto pela empresa (buscar um afiliado
existente por e-mail e adicioná-lo a uma campanha sem que ele solicite) e
convite de alguém que ainda não tem conta na plataforma.

Também implementado: perfil do afiliado (`updateAffiliateProfile`, em
`actions.ts` + `schemas.ts`) — nome, e-mail e telefone (em `User`), e nome de
exibição, bio, documento (CPF/CNPJ), cidade e redes sociais (Instagram,
TikTok, outra) em `AffiliateProfile`. UI em `/afiliado/perfil`, com o mesmo
aviso dispensável no dashboard que o módulo `companies` usa. Trocar o e-mail
aqui checa unicidade contra outros usuários antes de gravar, já que é a
credencial de login.
