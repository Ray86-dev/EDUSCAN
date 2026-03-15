"use client";

import Link from "next/link";

interface TopAppBarProps {
  title?: string;
  userName?: string;
}

export default function TopAppBar({ title = "EduScan", userName }: TopAppBarProps) {
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
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-lg">
            auto_awesome
          </span>
        </div>
        <h1 className="text-xl font-headline font-semibold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/perfil"
          className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-high rounded-full transition-colors"
          title="Mi perfil"
        >
          <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center text-xs font-bold text-on-primary-fixed">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
}
