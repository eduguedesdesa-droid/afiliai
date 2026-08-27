# Afiliai

[![CI](https://github.com/eduguedesdesa-droid/afiliai/actions/workflows/ci.yml/badge.svg)](https://github.com/eduguedesdesa-droid/afiliai/actions/workflows/ci.yml)

Plataforma SaaS de marketing de indicação e afiliados para empresas —
campanhas, cupons, links rastreáveis, leads, vendas e comissões, com
multi-tenancy real e suporte a múltiplos papéis por usuário.

Este README documenta o que já está implementado (Fases 0 a 5 do plano de
implementação, incluindo o painel administrativo da plataforma) e como
rodar o projeto localmente. A arquitetura
completa (schema de banco, decisões técnicas, riscos, plano de etapas) foi
discutida e aprovada antes da implementação — ver `docs/adr/` para decisões
específicas à medida que forem registradas.

## Stack

- **Next.js 16** (App Router, TypeScript) — front-end e back-end no mesmo
  app (Server Actions, Route Handlers), organizados por módulo de domínio
  para permitir extração futura sem reescrever regra de negócio.
- **PostgreSQL** + **Prisma ORM 7** (client via driver adapter `@prisma/adapter-pg`).
- **Tailwind CSS** para estilo.
- **jose** (JWT) + tabela `sessions` no banco para autenticação — sessão
  revogável de verdade, não apenas um token que expira sozinho.
- **Zod** para validação de formulários/inputs.

## O que já está implementado

- **Schema completo do banco** (`prisma/schema.prisma`) com todas as
  entidades do domínio: identidade/papéis, empresas, afiliados (perfil
  global + características para o futuro Afiliai Match), campanhas, regras
  de recompensa, tracking (links, cupons, cliques, sessões), leads, vendas,
  comissões (com histórico de status), pagamentos e auditoria.
- **Autenticação completa**: cadastro (empresa e afiliado), login, logout,
  recuperação e redefinição de senha (com e-mail transacional de verdade —
  ver seção E-mail transacional), sessão com cookie assinado + revogação
  no banco, proteção de rotas via `proxy.ts` (checagem otimista) e via DAL
  (`src/lib/dal.ts`, checagem segura em todo Server Component/Action).
- **Suporte a múltiplos papéis por usuário**: um usuário pode ser dono de
  uma empresa e afiliado de outra ao mesmo tempo. Quando isso acontece, a
  tela `/escolher-contexto` deixa a pessoa escolher com qual "chapéu" quer
  entrar; o "contexto ativo" é sempre revalidado contra os papéis reais no
  banco antes de qualquer acesso.
- **Shells dos três dashboards** (`/empresa`, `/afiliado`, `/admin`), cada um
  com dados reais vindos do banco (contagens e somas — zerados numa conta
  nova, populados no cenário de seed). As páginas de cada módulo futuro
  (campanhas, afiliados, leads, vendas, comissões, etc.) existem como rotas
  reais, mas com um aviso de "ainda não implementado" — para não haver links
  quebrados enquanto o restante do plano é construído.
- **Campanhas e produtos** (`/empresa/campanhas`, `/empresa/produtos`): criar
  campanha, mudar status (rascunho → ativa → pausada/encerrada), definir
  regra de recompensa (percentual ou valor fixo) e URL de destino; CRUD de
  produtos.
- **Participação de afiliado em campanha**: afiliado solicita participação
  numa campanha ativa de qualquer empresa (`/afiliado/campanhas-disponiveis`),
  a empresa aprova ou rejeita (`/empresa/afiliados`). Ao aprovar, cupom e/ou
  link são **gerados automaticamente** conforme o método de atribuição da
  campanha.
- **Tracking de ponta a ponta**: o link do afiliado (`/r/[code]`) registra
  clique, incrementa o contador e atualiza a sessão de atribuição do
  visitante (cookie `afiliai_visitor`, regra **last-click por empresa**,
  respeitando a janela de atribuição da campanha). Daí redireciona para:
  - o formulário público de lead (`/c/[campaignId]`), em campanhas de LEAD —
    o lead criado é atribuído ao afiliado certo a partir da sessão do
    visitante, nunca de um campo do formulário;
  - a `destinationUrl` configurada na campanha, em campanhas de venda; sem
    URL configurada, cai numa página interna simples mostrando o cupom do
    afiliado.
- **Leads** (`/empresa/leads`): lista os leads recebidos com o afiliado
  atribuído (ou "direto", quando não há atribuição) e permite mudar o status
  manualmente.
- **Vendas e comissões** (`/empresa/vendas`, `/empresa/comissoes`): a empresa
  registra uma venda manualmente — a atribuição ao afiliado é resolvida pelo
  método da campanha (código de cupom digitado, afiliado escolhido para
  campanhas de LINK, ou um lead já atribuído para campanhas de LEAD, que é
  automaticamente marcado como `CONVERTED`). Cada venda dispara o cálculo da
  comissão pela regra de recompensa da campanha, com status inicial
  `PENDING` ou `APPROVED` conforme `Campaign.approvalMode`. A empresa aprova,
  rejeita, marca como paga ou cancela pela máquina de estados central
  (`src/modules/commissions/service.ts`), sempre com histórico
  (`CommissionStatusHistory`). Cancelar uma venda propaga o cancelamento
  para a comissão. Idempotência por `externalOrderId` evita duplicar uma
  venda reenviada.
- **`/afiliado/conversoes`** e **`/afiliado/ganhos`**: o afiliado vê suas
  vendas atribuídas, o total de comissões por status (pendente, a receber,
  recebido) e o histórico de pagamentos já recebidos.
- **Relatórios** (`/empresa/relatorios`): exportação em CSV de campanhas,
  afiliados (com cliques, comissão gerada e paga), vendas e comissões.
- **Pagamentos** (`/empresa/payouts`): a empresa agrupa comissões `APROVADAS`
  de um afiliado — ainda não incluídas em nenhum outro lote — num pagamento;
  marcar o lote como pago transiciona todas as comissões incluídas para
  `PAID` de uma vez, pela mesma máquina de estados central da Fase 3. A
  marcação individual de uma comissão (Fase 3) continua funcionando em
  paralelo, para pagamentos avulsos.
- **Painel admin da plataforma** (`/admin/empresas`, `/admin/usuarios`): o
  admin suspende/reativa uma empresa ou um usuário. Suspender uma empresa
  bloqueia o acesso de verdade — `requireContext("COMPANY_MEMBER")`
  (`src/lib/dal.ts`) checa o status da empresa a cada requisição e
  redireciona para `/empresa-suspensa`, e o link do afiliado (`/r/[code]`)
  para de gerar clique/comissão para empresas suspensas. Suspender um
  usuário derruba todas as sessões ativas dele na hora e bloqueia login. Um
  admin nunca pode suspender a própria conta.
- **Esqueleto dos módulos de domínio** (`src/modules/*`) prontos para
  receber a lógica de negócio das próximas fases, cada um com um `README.md`
  descrevendo seu escopo e o que falta.

O que **não** está implementado ainda: webhook de e-commerce para registrar
vendas automaticamente (hoje é sempre lançamento manual pela empresa),
aplicação automática de cupom em checkout externo, integração com um
provedor de pagamento real (hoje "pago" é sempre uma marcação manual), e
moderação de conteúdo individual (campanha/afiliado) no painel admin — hoje
a moderação é só em nível de empresa/usuário inteiro. Ver a raiz de cada
módulo em `src/modules/` para o escopo planejado.

## Rodando localmente

### Pré-requisitos

- Node.js 22+
- pnpm
- PostgreSQL rodando localmente (ou acessível via `DATABASE_URL`)

### Passos

```bash
pnpm install

cp .env.example .env
# edite .env com sua DATABASE_URL e gere um SESSION_SECRET:
#   openssl rand -base64 32

pnpm db:migrate   # aplica as migrations no banco
pnpm db:seed      # popula um cenário de demonstração (opcional, mas recomendado)

pnpm dev          # http://localhost:3000
```

Para rodar os testes de integração (opcional): crie um banco dedicado
(`createdb afiliai_test`) e aponte `TEST_DATABASE_URL` para ele no `.env` —
ver seção Testes abaixo.

### Contas do seed (`pnpm db:seed`)

Todas com a senha `Senha123!`:

| Papel | E-mail | Cenário |
|---|---|---|
| Admin da plataforma | `admin@afiliai.com` | vê todas as empresas/afiliados |
| Empresa (Loja XYZ) | `empresa@demo.afiliai.com` | campanha "Indique e Ganhe", 10% de comissão |
| Afiliado (João) | `afiliado@demo.afiliai.com` | cupom `JOAO10`, 10 vendas confirmadas de R$500 cada |

Esse cenário reproduz o exemplo usado na definição do produto: 10 vendas,
R$5.000 em receita, 10% de comissão, R$500 gerados para o afiliado.

## E-mail transacional

Todo envio de e-mail passa por `sendEmail` (`src/lib/email.ts`), que fala
com a [Resend](https://resend.com) (chamada HTTP direta na API deles, sem
SDK). Hoje o único fluxo que usa isso é a recuperação de senha
(`requestPasswordReset`, `src/modules/auth/actions.ts`) — um futuro convite
de membro de empresa ou notificação de comissão chamaria a mesma função.

- **Sem `RESEND_API_KEY` configurada (padrão)**: nada é enviado de verdade —
  `sendEmail` loga o assunto e o corpo em texto puro (com o link) via
  `logger.info`, pra dar pra copiar o link e testar o fluxo localmente sem
  precisar de conta em provedor nenhum.
- **Com `RESEND_API_KEY` configurada**: envia de verdade. Configure no
  `.env`:
  ```
  RESEND_API_KEY="re_..."
  EMAIL_FROM="Afiliai <onboarding@resend.dev>"
  ```
  O padrão de `EMAIL_FROM` (`onboarding@resend.dev`) é o remetente de teste
  da própria Resend — funciona sem verificar domínio, mas só entrega para o
  e-mail da conta Resend usada para gerar a chave. Para enviar a qualquer
  destinatário, verifique um domínio próprio na Resend e troque `EMAIL_FROM`
  por um remetente desse domínio.
- `sendEmail` nunca lança exceção — se o provedor falhar ou estiver mal
  configurado, o fluxo que chamou continua (ex.: a recuperação de senha
  sempre responde com sucesso genérico, exista ou não o e-mail, para não
  vazar quem está cadastrado); a falha só fica registrada no log.

## Testes

Duas suítes, com propósitos diferentes:

- **`pnpm test`** — unitários (Vitest), sem banco. Cobre lógica pura:
  schemas de validação (Zod) de cada módulo, geração de CSV (`src/lib/csv.ts`),
  slug (`src/lib/slugify.ts`), codificação/decodificação do cookie de sessão
  (`src/lib/session-token.ts`) e o cálculo de comissão + a máquina de estados
  de `src/modules/commissions/service.ts` (`computeCommissionAmountCents`,
  `ALLOWED_TRANSITIONS`). `import "server-only"`/`"client-only"` são
  resolvidos para um stub vazio via alias em `vitest.config.mts` — esses
  pacotes não são dependências reais do projeto, só existem como resolução
  especial do bundler do Next.js (ver `AGENTS.md`).
- **`pnpm test:integration`** — bate num Postgres de verdade. Cobre os dois
  motores que fazem sentido só com banco: `src/modules/commissions/service.ts`
  (criação de comissão por regra/modo de aprovação, transições de status
  válidas/inválidas, cancelamento em cascata a partir de uma venda) e
  `src/modules/tracking/service.ts` (registro de clique, contador,
  last-click, rejeição para afiliado não aprovado ou empresa suspensa,
  resolução de atribuição respeitando janela/campanha). Cada teste começa
  truncando todas as tabelas (`src/test/db-reset.ts`) — nunca rodar isso
  contra o banco de desenvolvimento.

Configure `TEST_DATABASE_URL` no `.env` (ver `.env.example`) apontando para
um banco **dedicado** (`createdb afiliai_test`, por exemplo) — nunca o mesmo
do `DATABASE_URL` de desenvolvimento. `pnpm test:integration` aplica as
migrations nesse banco (`prisma migrate deploy`) antes de rodar.

`pnpm test:all` roda as duas suítes em sequência.

## CI

`.github/workflows/ci.yml` roda em todo push/PR para `main`: sobe um
Postgres de serviço, instala as dependências (`pnpm install
--frozen-lockfile`, que já dispara `postinstall` → `prisma generate`),
aplica as migrations do zero (`prisma migrate deploy` — pega drift de
schema sem migration correspondente), roda `pnpm lint`, `pnpm build` (que
inclui a checagem de tipos do TypeScript), `pnpm test` e `pnpm test:integration`
(reusando o mesmo Postgres de serviço — efêmero por execução, então é seguro
truncar tabelas nele).

## Estrutura de pastas

```
prisma/
  schema.prisma       # schema completo do banco
  seed.ts              # dados de demonstração
src/
  app/
    (auth)/            # login, cadastro, recuperação de senha
    escolher-contexto/ # seletor de papel quando o usuário tem mais de um
    empresa/            # dashboard e módulos da empresa
    afiliado/           # dashboard e módulos do afiliado
    admin/              # dashboard da plataforma
    r/[code]/           # redirecionamento público rastreável (route handler)
    c/[campaignId]/     # página pública de campanha (lead ou fallback de cupom)
  lib/                 # env, prisma client, sessão, DAL, contexto ativo
  modules/             # lógica de domínio por área — o que falta implementar
                         está documentado no README.md de cada módulo
  components/          # UI compartilhada
  test/                # helpers de teste (reset de banco, fixtures) — não é um módulo de domínio
  generated/prisma/    # client do Prisma gerado (não editar à mão)
scripts/
  with-test-db.mjs     # roda um comando com DATABASE_URL trocada por TEST_DATABASE_URL
```

## Convenções importantes

- **Todo valor monetário é armazenado em centavos** (`BigInt`), nunca float.
- **Toda tabela "tenant-scoped" carrega `companyId`** — nenhuma query deve
  omitir esse filtro. `src/lib/dal.ts` centraliza a checagem de sessão e
  papel para reduzir o risco de esquecer isso numa rota nova.
- **Nenhuma lógica de negócio em componente React** — vive em
  `src/modules/<área>/actions.ts` (Server Actions, o ponto de entrada
  autorizado — sempre confere sessão/posse antes de agir) ou, quando é
  chamada internamente por mais de um módulo (ex.: `tracking`,
  `commissions`), em `service.ts` sem `"use server"` nem checagem de
  autorização própria — a autorização é sempre responsabilidade de quem
  chama.
- **`proxy.ts`** faz apenas checagem otimista (cookie, sem banco) para
  redirecionar rápido. A autorização de verdade acontece sempre no DAL.
- **E-mail transacional** passa sempre por `sendEmail` (`src/lib/email.ts`) —
  nenhum módulo chama um provedor diretamente. Ver seção E-mail transacional
  abaixo.
