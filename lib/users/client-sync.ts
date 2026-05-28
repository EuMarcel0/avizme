/** Sincroniza o usuário autenticado com a tabela `users` (fallback ao trigger do banco). */
export async function syncUserOnClient() {
  const res = await fetch("/api/users/sync", { method: "POST" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Falha ao sincronizar usuário");
  }
}
