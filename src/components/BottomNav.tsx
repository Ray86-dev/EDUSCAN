"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "home", label: "Inicio" },
  { href: "/grupos", icon: "group", label: "Grupos" },
  { href: "/corregir", icon: "grading", label: "Corregir" },
  { href: "/curriculos", icon: "menu_book", label: "Currículos" },
  { href: "/perfil", icon: "person", label: "Perfil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-50 bg-surface-container-lowest border-t border-outline-variant/10 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
              className={`flex flex-col items-center gap-1 group px-3 py-1 ${
                isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
              } transition-colors`}
            >
              <div
                className={`px-5 py-1 rounded-full transition-all ${
                  isActive ? "bg-primary-fixed" : "bg-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={
                    isActive
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
              </div>
              <span
                className={`text-[10px] tracking-wide uppercase ${
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
