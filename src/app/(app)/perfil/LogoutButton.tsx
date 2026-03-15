"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full py-3 bg-error/10 text-error font-bold rounded-xl hover:bg-error/20 transition-colors min-h-[44px]"
    >
      Cerrar sesión
    </button>
  );
}
