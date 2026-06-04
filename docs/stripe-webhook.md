# Webhook Stripe (produção e dev)

O checkout funciona **sem** webhook (há sync ao voltar do Stripe com `?success=1`). O webhook mantém o plano atualizado quando o usuário cancela, renova ou o pagamento falha — sem depender só do retorno do browser.

## Produção (Vercel) — o que fazer

`stripe listen` é **só para desenvolvimento local**. Em produção:

### 1. Stripe Dashboard → Developers → Webhooks → Add endpoint

| Campo | Valor |
|--------|--------|
| **Endpoint URL** | `https://SEU-DOMINIO.com.br/api/webhooks/stripe` |
| (ex. Vercel) | `https://avizme.vercel.app/api/webhooks/stripe` |

### 2. Eventos (mínimo recomendado)

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### 3. Signing secret

Após criar o endpoint, abra o webhook → **Signing secret** → copie `whsec_...`.

### 4. Vercel → Environment Variables

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

Marque **Production** (e Preview se quiser). **Redeploy** o projeto.

---

## Desenvolvimento local (opcional)

Terminal 1:

```bash
pnpm dev
```

Terminal 2:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copie o `whsec_...` que o CLI imprime para `STRIPE_WEBHOOK_SECRET` no `.env` local.

---

## Conferir se está ok

1. Stripe → Webhooks → seu endpoint → aba **Recent deliveries** — deve mostrar `200` após um pagamento de teste.
2. Na Vercel, confirme que `STRIPE_WEBHOOK_SECRET` existe no ambiente **Production**.
3. A faixa na página **Plano** some quando o secret está carregado (após redeploy).

## Sem webhook

- Assinatura após checkout: sync via retorno `?success=1` na página de planos.
- Cancelamento/renovação fora do app: pode não refletir até abrir planos ou implementar webhook.
