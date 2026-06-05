# Supabase — Security Advisor

## Migration `0016_revoke_public_security_definer_rpc.sql`

Corrige avisos **Public / Signed-In Users Can Execute SECURITY DEFINER Function** para:

| Função | Ação |
|--------|------|
| `handle_new_user()` | `REVOKE` de `anon` / `authenticated` — continua via trigger em `auth.users` |
| `increment_usage_counter(...)` | Só `service_role` pode chamar RPC (dispatch no servidor) |
| `rls_auto_enable()` | `REVOKE` se a função existir no banco |

### Aplicar no projeto Supabase

1. Abra **SQL Editor** no dashboard do projeto.
2. Cole e execute o conteúdo de `db/migrations/0016_revoke_public_security_definer_rpc.sql`.
3. Em **Database → Security Advisor**, confira se os lints 0028/0029 sumiram (pode levar alguns minutos).

Ou rode pelo seu fluxo habitual de migrations (Drizzle / CLI), se já estiver configurado.

---

## Leaked password protection (dashboard)

O aviso **Leaked Password Protection Disabled** não se resolve por SQL.

1. Supabase Dashboard → **Authentication** → **Providers** → **Email** (ou **Settings** / **Attack Protection**, conforme a UI).
2. Ative **Prevent the use of leaked passwords** (Have I Been Pwned).
3. Salve.

Recomendado para cadastro com e-mail/senha. Não afeta login só com Google.

Documentação: [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
