"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { ButtonLabelSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth/google-oauth";
import { createClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  label?: string;
  next?: string;
};

export function GoogleSignInButton({
  label = "Continuar com Google",
  next,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await signInWithGoogle(supabase, { next });
    setLoading(false);

    if (error) {
      toast.error(
        error.message ||
          "Não foi possível iniciar o login com Google. Verifique a configuração no Supabase.",
      );
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 border-border/80 bg-white hover:bg-zinc-50 dark:bg-background dark:hover:bg-muted"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? (
        <ButtonLabelSkeleton className="w-40" />
      ) : (
        <>
          <FcGoogle className="size-5 shrink-0" aria-hidden />
          {label}
        </>
      )}
    </Button>
  );
}
