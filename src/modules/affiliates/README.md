# Módulo: Afiliados

Convite e cadastro de afiliados numa empresa, elegibilidade em campanhas.

**Status:** parcialmente implementado (Fase 1) — fluxo de autoatendimento:
o afiliado solicita participação numa campanha ativa
(`requestToJoinCampaign`) e a empresa aprova ou rejeita
(`respondToJoinRequest`, em `actions.ts`), que dispara a geração de
cupom/link (ver módulo `tracking`). UI em `/afiliado/campanhas-disponiveis`,
`/afiliado/minhas-campanhas` e `/empresa/afiliados`.

Também implementado: empresa adiciona um afiliado diretamente, sem esperar
solicitação (`addAffiliateManually`, lógica em `service.ts`, action com
validação/autorização em `actions.ts`) — cobre tanto um e-mail que já tem
conta (só entra na campanha, com o cupom definido pela empresa; os demais
dados do perfil não são tocados, permanecem editáveis só pelo próprio
afiliado) quanto um e-mail novo (cria a conta com uma senha aleatória e
manda um convite por e-mail com link de definir senha — reaproveita o mesmo
mecanismo de "esqueci minha senha", `resetPassword`/`redefinir-senha/[token]`
de `modules/auth`). Como cupom só existe dentro de uma campanha, a primeira
vez que uma empresa usa esse fluxo cria automaticamente uma campanha
"Divulgação geral" (`attributionMethod: COUPON`) — invisível na UI normal de
campanhas até a empresa configurar uma regra de recompensa nela, se quiser
gerar comissão. UI em `/empresa/afiliados` (formulário no topo da página).

Também implementado: perfil do afiliado (`updateAffiliateProfile`, em
`actions.ts` + `schemas.ts`) — nome, e-mail e telefone (em `User`), e nome de
exibição, bio, documento (CPF/CNPJ), cidade e redes sociais (Instagram,
TikTok, outra) em `AffiliateProfile`. UI em `/afiliado/perfil`, com o mesmo
aviso dispensável no dashboard que o módulo `companies` usa. Trocar o e-mail
aqui checa unicidade contra outros usuários antes de gravar, já que é a
credencial de login.
