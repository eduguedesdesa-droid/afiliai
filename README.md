# Afiliai

Plataforma SaaS de marketing de indicação e afiliados para empresas —
campanhas, cupons, links rastreáveis, leads, vendas e comissões, com
multi-tenancy real e suporte a múltiplos papéis por usuário.

Este README documenta o que já está implementado (Fases 0 a 3 do plano de
implementação) e como rodar o projeto localmente. A arquitetura
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
  recuperação e redefinição de senha, sessão com cookie assinado + revogação
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
  vendas atribuídas e o total de comissões por status (pendente, a receber,
  recebido).
- **Esqueleto dos módulos de domínio** (`src/modules/*`) prontos para
  receber a lógica de negócio das próximas fases, cada um com um `README.md`
  descrevendo seu escopo e o que falta.

O que **não** está implementado ainda (fases seguintes do plano): webhook de
e-commerce para registrar vendas automaticamente (hoje é sempre lançamento
manual pela empresa), aplicação automática de cupom em checkout externo,
relatórios exportáveis, pagamentos em lote (payouts) e o painel
administrativo da plataforma. Ver a raiz de cada módulo em `src/modules/`
para o escopo planejado.

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

### Contas do seed (`pnpm db:seed`)

Todas com a senha `Senha123!`:

| Papel | E-mail | Cenário |
|---|---|---|
| Admin da plataforma | `admin@afiliai.com` | vê todas as empresas/afiliados |
| Empresa (Loja XYZ) | `empresa@demo.afiliai.com` | campanha "Indique e Ganhe", 10% de comissão |
| Afiliado (João) | `afiliado@demo.afiliai.com` | cupom `JOAO10`, 10 vendas confirmadas de R$500 cada |

Esse cenário reproduz o exemplo usado na definição do produto: 10 vendas,
R$5.000 em receita, 10% de comissão, R$500 gerados para o afiliado.

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
  modules/             # lógica de domínio por área (auth implementado; os
                         demais são esqueleto para as próximas fases)
  components/          # UI compartilhada
  generated/prisma/    # client do Prisma gerado (não editar à mão)
```

## Convenções importantes

- **Todo valor monetário é armazenado em centavos** (`BigInt`), nunca float.
- **Toda tabela "tenant-scoped" carrega `companyId`** — nenhuma query deve
  omitir esse filtro. `src/lib/dal.ts` centraliza a checagem de sessão e
  papel para reduzir o risco de esquecer isso numa rota nova.
- **Nenhuma lógica de negócio em componente React ou route handler** — vive
  em `src/modules/<área>/service.ts`, chamada a partir da UI.
- **`proxy.ts`** faz apenas checagem otimista (cookie, sem banco) para
  redirecionar rápido. A autorização de verdade acontece sempre no DAL.
- Envio de e-mail (recuperação de senha, convites) ainda não está integrado
  a um provedor — por enquanto, o link é apenas registrado via `logger.info`
  em desenvolvimento (ver `TODO` em `src/modules/auth/actions.ts`).
