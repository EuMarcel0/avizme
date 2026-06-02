import "server-only";

import { headers } from "next/headers";
import type Stripe from "stripe";

import {
  downgradeUserByCustomerId,
  linkStripeCustomerToUser,
  syncSubscriptionFromStripe,
} from "@/lib/billing/sync-subscription";
import { revalidateBillingPaths } from "@/lib/billing/revalidate-billing-paths";
import { getStripe } from "@/lib/billing/stripe-config";
import { env } from "@/lib/env";

export async function handleStripeWebhook(body: string): Promise<Response> {
  if (!env.stripeWebhookSecret) {
    return new Response("Webhook não configurado", { status: 500 });
  }

  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");
  if (!signature) {
    return new Response("Assinatura ausente", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assinatura inválida";
    console.error("[stripe:webhook]", message);
    return new Response(message, { status: 400 });
  }

  try {
    let shouldRevalidate = false;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          const userId = session.metadata?.avizme_user_id;
          if (customerId && userId) {
            await linkStripeCustomerToUser(userId, customerId);
          }
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription =
            await getStripe().subscriptions.retrieve(subscriptionId);
          await syncSubscriptionFromStripe(subscription);
          shouldRevalidate = true;
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripe(subscription);
        shouldRevalidate = true;
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await downgradeUserByCustomerId(customerId);
        shouldRevalidate = true;
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        if (invoice.subscription) {
          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id;
          const subscription =
            await getStripe().subscriptions.retrieve(subscriptionId);
          await syncSubscriptionFromStripe(subscription);
          shouldRevalidate = true;
        }
        break;
      }
      default:
        break;
    }

    if (shouldRevalidate) {
      revalidateBillingPaths();
    }
  } catch (error) {
    console.error("[stripe:webhook:handler]", error);
    return new Response("Erro ao processar evento", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
