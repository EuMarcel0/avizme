import "server-only";

import { revalidatePath } from "next/cache";

/** Invalida cache de rotas que exibem plano/limites. Use em webhooks e Server Actions, não durante render. */
export function revalidateBillingPaths(): void {
  revalidatePath("/app", "layout");
  revalidatePath("/app/plano");
}
