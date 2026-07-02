"use client";

import { CreditCard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemeMenuItem } from "@/components/theme/theme-toggle";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { PlanTier } from "@/lib/billing/plans";
import type { AppUser } from "@/lib/users/display-user";
import { getDisplayName, getUserInitials } from "@/lib/users/display-user";
import { cn } from "@/lib/utils";

function planBadgeClass(tier: PlanTier | undefined): string {
  switch (tier) {
    case "premium":
      return "border-primary/30 bg-primary/10 text-primary";
    case "pro":
      return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

export function UserMenu({ user }: { user: AppUser }) {
  const router = useRouter();
  const supabase = createClient();
  const displayName = getDisplayName(user);
  const planLabel = user.planLabel ?? "Pro";

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Menu do usuário"
      >
        <Avatar size="default" className="size-9 cursor-pointer">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-primary/15 text-sm font-medium text-primary dark:bg-primary/25">
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            <Badge
              variant="outline"
              className={cn("mt-2 font-medium", planBadgeClass(user.planTier))}
            >
              Plano {planLabel}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/app/plano")}
        >
          <CreditCard className="size-4" />
          Plano e cobrança
        </DropdownMenuItem>
        <ThemeMenuItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleSignOut}
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
