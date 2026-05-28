"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  showError?: boolean;
  className?: string;
  children: React.ReactNode;
};

function FormField({
  id,
  label,
  error,
  showError = false,
  className,
  children,
}: FormFieldProps) {
  const message = showError && error ? error : null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id} className="shrink-0">
          {label}
        </Label>
        <p
          className={cn(
            "min-h-5 min-w-0 flex-1 truncate text-right text-xs leading-5 text-destructive",
            !message && "invisible",
          )}
          role={message ? "alert" : undefined}
          aria-live="polite"
        >
          {message ?? "\u00a0"}
        </p>
      </div>
      {children}
    </div>
  );
}

export { FormField };
