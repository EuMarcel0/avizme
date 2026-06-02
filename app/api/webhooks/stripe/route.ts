import { handleStripeWebhook } from "@/lib/billing/handle-stripe-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  return handleStripeWebhook(body);
}
