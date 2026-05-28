"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useModal } from "@/hooks/use-modal";

export function AppModal() {
  const { isOpen, options, closeModal } = useModal();

  if (!options) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open && !options.preventClose) {
      closeModal();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!options.preventClose}
        className={cn(
          "w-[min(96vw,56rem)] max-w-[min(96vw,56rem)] gap-0 p-0",
          options.className,
        )}
      >
        {(options.title || options.description) && (
          <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4">
            {options.title && <DialogTitle>{options.title}</DialogTitle>}
            {options.description && (
              <DialogDescription>{options.description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {options.content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
