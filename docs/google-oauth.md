# Login com Google (Supabase + Avizme)

O app já chama `signInWithOAuth({ provider: "google" })`. As credenciais do Google **não** vão no `.env` do Next.js — ficam no **Supabase** (e no Google Cloud).

## O que você precisa obter

| Onde | O quê |
|------|--------|
| **Google Cloud Console** | OAuth Client ID + Client Secret (tipo *Aplicativo da Web*) |
| **Supabase Dashboard** | Colar Client ID e Secret no provedor Google |
| **Supabase Dashboard** | Site URL + Redirect URLs do seu app |
| **`.env` do Avizme** | Apenas Supabase URL/keys + `NEXT_PUBLIC_APP_URL` (já existentes) |

Não é necessário `GOOGLE_CLIENT_ID` no `.env` deste projeto.

---

## 1. Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie ou selecione um projeto.
3. **APIs e serviços → Tela de consentimento OAuth**
   - Tipo: Externo (ou Interno se for Workspace).
   - Preencha nome do app, e-mail de suporte e domínios (em produção).
   - Escopos: `email`, `profile`, `openid` (padrão do login).
4. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**
   - Tipo: **Aplicativo da Web**
   - **Origens JavaScript autorizadas**
     - `http://localhost:3000`
     - `https://SEU-DOMINIO.com.br` (produção)
   - **URIs de redirecionamento autorizados** (importante: URL do **Supabase**, não do Next)
     - `https://SEU-PROJECT-REF.supabase.co/auth/v1/callback`

   O `PROJECT-REF` está em Supabase → **Project Settings → General → Project URL**  
   (ex.: `https://abcdefgh.supabase.co` → redirect `https://abcdefgh.supabase.co/auth/v1/callback`).

5. Copie **Client ID** e **Client secret**.

---

## 2. Supabase Dashboard

1. [Supabase](https://supabase.com/dashboard) → seu projeto.
2. **Authentication → Providers → Google**
   - Ative o provedor.
   - Cole **Client ID** e **Client Secret** do Google.
   - Salve.
3. **Authentication → URL Configuration**
   - **Site URL**
     - Dev: `http://localhost:3000`
     - Prod: `https://SEU-DOMINIO.com.br`
   - **Redirect URLs** (adicione todas que usar):
     ```
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     https://SEU-DOMINIO.com.br/**
     https://SEU-DOMINIO.com.br/auth/callback
     ```

---

## 3. Variáveis no Avizme (`.env`)

Já usadas pelo fluxo OAuth:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# ou SUPABASE_API_URL + SUPABASE_PUBLISHABLE_KEY

# URL pública do app (deve bater com Site URL / redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Em produção (Vercel etc.), defina `NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.com.br`.

---

## 4. Fluxo no código

1. Usuário clica **Continuar com Google** (`/login` ou `/cadastro`).
2. Supabase redireciona para o Google.
3. Google volta para `https://PROJECT.supabase.co/auth/v1/callback`.
4. Supabase redireciona para `https://seu-app/auth/callback?code=...`.
5. `app/auth/callback/route.ts` troca o `code` por sessão e sincroniza `public.users`.

---

## 5. Checklist rápido

- [ ] Google: redirect URI = `https://XXX.supabase.co/auth/v1/callback`
- [ ] Supabase: Google provider ativo com Client ID/Secret
- [ ] Supabase: Redirect URLs incluem `/auth/callback` do app
- [ ] `.env`: `NEXT_PUBLIC_APP_URL` correto em produção
- [ ] Testar em aba anônima: Login → Google → cair em `/app`

## Problemas comuns

| Sintoma | Causa provável |
|---------|----------------|
| `redirect_uri_mismatch` | URI no Google não é a do Supabase (`/auth/v1/callback`) |
| Volta para `/login?error=auth` | Redirect URL do app não listada no Supabase |
| Login ok mas sem perfil | Rodar migration/`users` ou ver logs de `/api/users/sync` |
| Google desabilitado | Provider Google off no Supabase |
| `https://seu-app.vercel.app/?code=...` + 404 Vercel | Site URL no Supabase = raiz do domínio; falta deploy ou redirect `/auth/callback` |

### `/?code=...` na Vercel (404 DEPLOYMENT_NOT_FOUND)

Dois problemas ao mesmo tempo:

1. **Supabase** está usando só o **Site URL** (`https://avizme.vercel.app`) e manda o `code` para `/`, não para `/auth/callback`.
2. **Vercel** não tem deploy ativo nesse domínio (`DEPLOYMENT_NOT_FOUND`).

**No Supabase → Authentication → URL Configuration** (projeto `ojuetvuhevqacivolven`):

- **Site URL:** `https://avizme.vercel.app` (ou seu domínio final)
- **Redirect URLs** — adicione **exatamente**:
  ```
  https://avizme.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

**Na Vercel:**

- Faça deploy do projeto (push na branch ligada ao projeto).
- Em **Settings → Environment Variables**, defina `NEXT_PUBLIC_APP_URL=https://avizme.vercel.app` (e as chaves Supabase).
- Confirme que o domínio `avizme.vercel.app` aponta para um deployment **Ready**.

O app também redireciona `/?code=...` → `/auth/callback` no middleware (fallback), mas o deploy na Vercel precisa existir.

**Teste local:** com `NEXT_PUBLIC_APP_URL=http://localhost:3000`, use Google login em `http://localhost:3000/login` e mantenha no Supabase o redirect `http://localhost:3000/auth/callback`.
