"use client";

import { useRouter } from "next/navigation";

import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

type PlanPageLinkProps = {
  children: React.ReactNode;
  className?: string;
};

/** Navega para /app/plano e fecha o modal global (ex.: novo lembrete). */
export function PlanPageLink({ children, className }: PlanPageLinkProps) {
  const router = useRouter();
  const { closeModal } = useModal();

  return (
    <button
      type="button"
      className={cn(
        "inline text-left text-primary underline-offset-2 hover:underline",
        className,
      )}
      onClick={() => {
        closeModal();
        router.push("/app/plano");
      }}
    >
      {children}
    </button>
  );
}
