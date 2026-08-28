# Deploy na Vercel — checklist

Guia para o primeiro deploy em produção. Vercel para hospedar o app +
Supabase para o banco (Postgres) — o projeto usa `pg` + `@prisma/adapter-pg`
diretamente, sem driver específico de um provedor, então qualquer Postgres
gerenciado funcionaria, mas o resto deste guia já vem com os detalhes
específicos do Supabase resolvidos.

## 1. Banco de dados (Supabase)

- [ ] Criar um projeto no [Supabase](https://supabase.com) (se ainda não
      tiver).
- [ ] Em Project Settings → Database → Connection string, o Supabase
      oferece **três** connection strings — guardar as duas primeiras
      (a terceira raramente é necessária aqui):
  - **Transaction pooler** (porta 6543) — vai virar `DATABASE_URL` no
    passo 3, é a que o app usa em produção.
  - **Direct connection** (porta 5432, host `db.<ref>.supabase.co`, sem
    passar pelo pooler) — usada só nos passos 4 e 5 abaixo, nunca pelo app
    rodando.
- [ ] O painel do Supabase costuma sugerir adicionar `?pgbouncer=true` no
  fim da connection string da pooler — esse parâmetro é pro motor de query
  clássico do Prisma (que cacheia prepared statements nomeados, incompatível
  com o modo *transaction* do PgBouncer). **Não é necessário aqui**: o
  projeto usa `@prisma/adapter-pg` (`src/lib/prisma.ts`), que por padrão
  **não** cacheia prepared statements nomeados (confirmado no próprio pacote
  — só cacheia se você passar um `statementNameGenerator`, o que este
  projeto não faz), então a pooler funciona normalmente sem o parâmetro. É
  inofensivo incluir se o Supabase já colocar automaticamente, só não é o
  que resolve nada aqui.
- [ ] Guardar as duas connection strings (pooler + direta) para os
      próximos passos.

## 2. Domínio + Resend (e-mail transacional)

Sem isso, a recuperação de senha não entrega e-mail pra ninguém além da sua
própria conta Resend (ver `README.md`, seção E-mail transacional).

- [ ] Conectar o domínio próprio na Vercel (Settings → Domains).
- [ ] Criar uma conta na [Resend](https://resend.com) (se ainda não tiver).
- [ ] Verificar esse mesmo domínio na Resend (Domains → Add Domain) —
      adiciona os registros DNS (SPF/DKIM) que a Resend pedir.
- [ ] Gerar uma API key na Resend (Settings → API Keys).
- [ ] Decidir o remetente, ex.: `Afiliai <contato@seudominio.com>` — só
      funciona depois do domínio verificado no passo anterior.

## 3. Variáveis de ambiente na Vercel

Configurar em Project Settings → Environment Variables, ambiente
**Production** (ver `.env.example` para referência):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a **Transaction pooler** do Supabase (porta 6543) do passo 1 — nunca a direta aqui |
| `SESSION_SECRET` | **gerar uma nova** — `openssl rand -base64 32`. Nunca reusar o valor de dev/`.env` local. |
| `APP_URL` | `https://seudominio.com` (o domínio de produção, com `https://`) |
| `RESEND_API_KEY` | a API key gerada no passo 2 |
| `EMAIL_FROM` | o remetente decidido no passo 2, ex.: `Afiliai <contato@seudominio.com>` |

**Não configurar em produção:**
- `NODE_ENV` — a Vercel já define isso automaticamente (`production` em
  builds de produção); sobrescrever manualmente pode quebrar otimizações do
  Next.
- `TEST_DATABASE_URL` / `E2E_DATABASE_URL` / `E2E_TESTING` — só fazem
  sentido em CI/dev. **`E2E_TESTING` em especial nunca pode ir para
  produção** — ela desliga o rate limit de login/cadastro/recuperação de
  senha (ver `src/lib/rate-limit.ts`).

## 4. Migrations no banco de produção

O Vercel não roda `prisma migrate deploy` sozinho — ele só faz `pnpm
install` (que dispara `postinstall` → `prisma generate`, gerando o client)
e `pnpm build`. É preciso aplicar as migrations manualmente antes do
primeiro deploy, e a cada deploy que adicionar uma migration nova:

```bash
DATABASE_URL="<a connection string DIRETA do Supabase, porta 5432>" pnpm exec prisma migrate deploy
```

**Use a connection direta aqui, não a pooler.** `prisma migrate deploy` usa
um advisory lock do Postgres pra evitar duas migrations rodando ao mesmo
tempo — isso depende de todas as queries de uma migration caírem na mesma
conexão física, o que o modo *transaction* do PgBouncer (a pooler do
Supabase) não garante. Pela mesma razão, **não** vale sobrescrever o Build
Command da Vercel para rodar `prisma migrate deploy` automaticamente ali —
o ambiente de build da Vercel só teria acesso à `DATABASE_URL` (a pooler).
Mantenha esse passo manual, rodado da sua máquina, antes de cada deploy que
adicionar uma migration nova.

## 5. Primeiro admin da plataforma

**Não rode `prisma/seed.ts` contra o banco de produção** — ele cria dados
de demonstração com senhas conhecidas (`Senha123!`). Hoje não existe
cadastro público para o papel de admin da plataforma (por design — é
global, não por empresa). Pra ter o primeiro admin:

```bash
DATABASE_URL="<a connection string DIRETA do Supabase, porta 5432>" pnpm exec tsx -e '
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const passwordHash = await bcrypt.hash("TROQUE-ESSA-SENHA", 12);
const admin = await prisma.user.create({ data: { email: "voce@seudominio.com", name: "Seu Nome", passwordHash, status: "ACTIVE" } });
await prisma.userRole.create({ data: { userId: admin.id, role: "PLATFORM_ADMIN" } });
console.log("Admin criado:", admin.email);
'
```

Troque o e-mail e a senha antes de rodar. Empresas e afiliados não
precisam disso — eles se cadastram normalmente pela UI (`/cadastro/empresa`,
`/cadastro/afiliado`).

## 6. Deploy

- [ ] Conectar o repositório GitHub na Vercel (New Project → importar
      `eduguedesdesa-droid/afiliai`).
- [ ] Confirmar que o Framework Preset é "Next.js" (detecção automática).
- [ ] Rodar o deploy (push para `main`, ou o botão Deploy).

## 7. Depois do primeiro deploy — smoke test

- [ ] Acessar o domínio de produção, confirmar que `/` carrega.
- [ ] Login com o admin criado no passo 5.
- [ ] Cadastrar uma empresa de teste pela UI (`/cadastro/empresa`).
- [ ] Pedir recuperação de senha pra ela e confirmar que o e-mail chega de
      verdade (não só loga — isso confirma que Resend/domínio estão OK).
- [ ] Cadastrar um afiliado de teste, solicitar participação numa campanha,
      aprovar, clicar no link gerado, registrar uma venda — o fluxo
      completo, o mesmo que `e2e/core-flow.spec.ts` cobre localmente.
- [ ] Apagar as contas de teste depois (ou deixar como smoke test
      permanente, se preferir).

## Limitações conhecidas em produção (aceitas para um piloto pequeno)

- **Rate limit em memória** (`src/lib/rate-limit.ts`): funciona certo
  contra uma única instância do servidor. A Vercel roda funções serverless
  que podem escalar para múltiplas instâncias sob carga — nesse caso, o
  limite vira "N tentativas por instância", não "N no total". Para um
  piloto com poucos usuários simultâneos isso não costuma ser um problema
  na prática, mas antes de abrir para mais gente, trocar por um store
  compartilhado (ex.: Upstash Redis, que tem integração nativa com a
  Vercel) é o próximo passo de hardening — a assinatura de
  `checkRateLimit` já foi desenhada pra essa troca ser localizada.
- Sem convite de outros membros de uma empresa (só quem se cadastra vira
  dono), sem webhook de e-commerce, pagamento ao afiliado é sempre marcação
  manual — ver `README.md`, seção "O que já está implementado".
