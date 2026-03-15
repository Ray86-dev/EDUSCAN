"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface TopAppBarProps {
  title?: string;
  userName?: string;
}

export default function TopAppBar({ title = "EduScan", userName }: TopAppBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Obtener iniciales del nombre
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-lg">
            auto_awesome
          </span>
        </div>
        <h1 className="text-xl font-headline font-semibold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-high rounded-full transition-colors"
          title="Cerrar sesión"
        >
          <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center text-xs font-bold text-on-primary-fixed">
            {initials}
          </div>
        </button>
      </div>
    </header>
  );
}
