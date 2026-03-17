"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconGroup, IconCorrectGroup, IconActivities, IconCurriculum } from "@/components/icons";
import { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface NavItem {
  href: string;
  Icon: IconComponent;
  label: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", Icon: IconHome, label: "Inicio" },
  { href: "/grupos", Icon: IconGroup, label: "Grupos" },
  { href: "/corregir/grupo", Icon: IconCorrectGroup, label: "Corregir", isCenter: true },
  { href: "/actividades", Icon: IconActivities, label: "Actividades" },
  { href: "/curriculos", Icon: IconCurriculum, label: "Currículos" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/10 px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-h-[64px]">
      <div className="max-w-md mx-auto flex justify-around items-end">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 -mt-5"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-[background-color,box-shadow] ${
                  isActive
                    ? "bg-primary shadow-primary/30"
                    : "bg-primary/90 shadow-primary/20 hover:bg-primary"
                }`}>
                  <item.Icon size={28} className="text-on-primary" />
                </div>
                <span className={`text-[10px] uppercase whitespace-nowrap text-center leading-tight ${
                  isActive ? "font-bold text-primary" : "font-medium text-on-surface-variant"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 group px-1 py-2 min-h-[48px] flex-1 ${
                isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
              } transition-colors`}
            >
              <div
                className={`px-3 py-1 rounded-full transition-colors ${
                  isActive ? "bg-primary-fixed" : "bg-transparent"
                }`}
              >
                <item.Icon size={24} />
              </div>
              <span
                className={`text-[10px] uppercase whitespace-nowrap text-center leading-tight ${
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
