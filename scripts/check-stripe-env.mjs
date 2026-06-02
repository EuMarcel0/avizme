import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

const secret = process.env.STRIPE_SECRET_KEY?.trim();
const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const pricePro = process.env.STRIPE_PRICE_PRO?.trim();
const priceBusiness = process.env.STRIPE_PRICE_BUSINESS?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

const issues = [];

if (!secret) {
  issues.push("STRIPE_SECRET_KEY vazio — Dashboard → Developers → API keys → Secret key");
} else if (!secret.startsWith("sk_test_") && !secret.startsWith("sk_live_")) {
  issues.push("STRIPE_SECRET_KEY formato inválido (esperado sk_test_... ou sk_live_...)");
}

if (!webhook) {
  issues.push("STRIPE_WEBHOOK_SECRET vazio — rode: stripe listen --forward-to localhost:3000/api/webhooks/stripe");
} else if (!webhook.startsWith("whsec_")) {
  issues.push("STRIPE_WEBHOOK_SECRET formato inválido (esperado whsec_...)");
}

for (const [name, value] of [
  ["STRIPE_PRICE_PRO", pricePro],
  ["STRIPE_PRICE_BUSINESS", priceBusiness],
]) {
  if (!value) {
    issues.push(`${name} vazio`);
  } else if (value.startsWith("prod_")) {
    issues.push(`${name}=${value} é Product ID — use Price ID (price_...) na página do produto → Pricing`);
  } else if (!value.startsWith("price_")) {
    issues.push(`${name}=${value} não é Price ID — copie price_... do Stripe (não o valor R$)`);
  }
}

if (!appUrl) {
  issues.push("NEXT_PUBLIC_APP_URL vazio");
} else if (appUrl.includes("localhost") && process.env.NODE_ENV === "production") {
  issues.push("NEXT_PUBLIC_APP_URL aponta para localhost em produção");
}

if (issues.length === 0) {
  console.log("OK — Stripe configurado para checkout e webhook.");
  process.exit(0);
}

console.log("Pendências no .env:\n");
for (const issue of issues) {
  console.log(`- ${issue}`);
}
process.exit(1);
