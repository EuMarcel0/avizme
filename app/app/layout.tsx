import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/users/display-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUser: AppUser = {
    email: user.email ?? "",
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };

  return <AppShell user={appUser}>{children}</AppShell>;
}
