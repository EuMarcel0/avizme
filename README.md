# Avizme

App mobile-first de lembretes enviados por **SMS**, **WhatsApp** e **e-mail**, com agendamento flexível (dia/hora, intervalos, múltiplos horários no mesmo dia, etc.).

## Stack

- **Next.js 16** (App Router, Server Components)
- **Supabase** (Auth + Postgres)
- **Drizzle ORM** (migrations)
- **shadcn/ui** + **Tailwind CSS v4**
- **Formik** + **Yup**
- **TanStack Query**
- **Lodash**

## Começar

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha (o projeto já aceita `SUPABASE_API_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_DB_DIRECT_CONNECTION_STRING`).

## Sync do usuário (`/api/users/sync`)

O cadastro/login sincroniza o perfil na tabela `users` pela **API do Supabase** (não exige conexão Postgres direta no runtime). As migrations Drizzle usam `SUPABASE_DB_DIRECT_CONNECTION_STRING` apenas no CLI (`pnpm db:migrate`).

Se aparecer `relation "public.users" does not exist`, as tabelas ainda não foram criadas. No Supabase: **SQL Editor** → abra o arquivo `db/supabase-setup.sql` do projeto → cole e execute **o script inteiro** (não só a policy de INSERT).

## Banco de dados (migrations)

```bash
# Gerar migration a partir do schema
pnpm db:generate

# Aplicar migrations no Supabase
pnpm db:migrate

# Alternativa rápida (dev)
pnpm db:push
```

Se a senha do Postgres tiver `@`, codifique na connection string (`@` → `%40`). Ex.: `1590S1ilva@@` → `1590S1ilva%40%40`.

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Dados do usuário (vinculado a `auth.users`; criado no cadastro via trigger + sync API) |
| `reminders` | Lembretes |
| `reminder_schedules` | Regras de agendamento flexíveis |
| `reminder_delivery_channels` | Canais (sms / whatsapp / email) |
| `reminder_occurrences` | Instâncias agendadas para envio |

## Auth

- `/login` — e-mail/senha + Google OAuth
- `/cadastro` — cadastro básico
- `/app` — área autenticada

No Supabase Dashboard, habilite o provedor **Google** em Authentication → Providers e configure a URL de redirect: `http://localhost:3000/auth/callback`.

## Paleta de cores

`#f7f0ba` · `#e0dba4` · `#a9cba6` · `#7ebea3` · `#53a08e` (definidas em `app/globals.css`).
