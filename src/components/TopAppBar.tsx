"use client";

import Image from "next/image";
import Link from "next/link";
import { EduScanLogo } from "@/components/icons";

interface TopAppBarProps {
  title?: string;
  userName?: string;
  avatarUrl?: string;
}

export default function TopAppBar({ title = "EduScan", userName, avatarUrl }: TopAppBarProps) {
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/15 px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between min-h-[56px]">
      <div className="flex items-center gap-4">
        <EduScanLogo size={36} className="rounded-lg" />
        <h1 className="text-xl font-headline font-semibold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/perfil"
          className="flex items-center justify-center gap-2 px-3 py-2 min-h-[44px] min-w-[44px] hover:bg-surface-container-high rounded-full transition-colors"
          title="Mi perfil"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName || "Avatar"}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center text-xs font-bold text-on-primary-fixed">
              {initials}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
