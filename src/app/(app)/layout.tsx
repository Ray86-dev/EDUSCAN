import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopAppBar from "@/components/TopAppBar";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName = user.user_metadata?.full_name || user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

  return (
    <>
      <TopAppBar userName={userName} avatarUrl={avatarUrl} />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </>
  );
}
