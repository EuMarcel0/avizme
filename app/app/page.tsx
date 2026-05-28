import { AppHome } from "@/components/app/app-home";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "usuário";

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("email, phone")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <AppHome
      displayName={displayName}
      userEmail={profile?.email ?? user?.email ?? null}
      userPhone={profile?.phone ?? null}
    />
  );
}
