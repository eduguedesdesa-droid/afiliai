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
