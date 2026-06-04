"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  auth: "Não foi possível concluir o login. Tente novamente ou use e-mail e senha.",
  oauth: "Login com Google cancelado ou falhou.",
};

export function AuthOAuthErrorHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    toast.error(MESSAGES[code] ?? "Erro de autenticação.");
  }, [searchParams]);

  return null;
}
