import { createBillingPortalAction } from "@/app/actions/billing";

export async function POST() {
  await createBillingPortalAction();
}
