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

  return (
    <>
      <TopAppBar userName={userName} />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </>
  );
}
