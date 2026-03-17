"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconGroup, IconGrading, IconCurriculum, IconProfile } from "@/components/icons";
import { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const navItems: { href: string; Icon: IconComponent; label: string }[] = [
  { href: "/", Icon: IconHome, label: "Inicio" },
  { href: "/grupos", Icon: IconGroup, label: "Grupos" },
  { href: "/corregir", Icon: IconGrading, label: "Corregir" },
  { href: "/curriculos", Icon: IconCurriculum, label: "Currículos" },
  { href: "/perfil", Icon: IconProfile, label: "Perfil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/10 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-h-[64px]">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 group px-3 py-2 min-h-[48px] ${
                isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
              } transition-colors`}
            >
              <div
                className={`px-5 py-1 rounded-full transition-all ${
                  isActive ? "bg-primary-fixed" : "bg-transparent"
                }`}
              >
                <item.Icon size={24} />
              </div>
              <span
                className={`text-[11px] tracking-wide uppercase ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
