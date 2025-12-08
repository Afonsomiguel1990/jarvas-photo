"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Camera, CreditCard, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ElementType<{ className?: string }>;
  href: string;
};

type MobileNavProps = {
  items?: NavItem[];
};

const defaultItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/app" },
  { label: "Enhance", icon: Camera, href: "/app/enhance" },
  { label: "Créditos", icon: CreditCard, href: "/app/credits" },
  { label: "Histórico", icon: Clock, href: "/app/history" },
];

export function MobileNav({ items }: MobileNavProps) {
  const finalItems = useMemo(() => {
    if (!items || items.length < 2) return defaultItems;
    return items;
  }, [items]);

  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = useMemo(() => {
    // Procura o match mais específico primeiro, ou o exact match
    const index = finalItems.findIndex((item) => item.href === pathname);
    if (index !== -1) return index;
    // Fallback para home se estivermos em /app mas não num sub-rota específica (exceção feita pois home é /app)
    return finalItems.findIndex((item) => item.href === "/app");
  }, [pathname, finalItems]);

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-50 flex w-[92%] max-w-3xl -translate-x-1/2 items-center justify-between rounded-2xl border border-white/10 bg-[#0d0b12]/90 px-3 py-2 shadow-2xl backdrop-blur"
      aria-label="Menu principal"
    >
      {finalItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === activeIndex;
        return (
          <button
            key={item.label}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-neutral-300 transition-all",
              isActive && "bg-white/10 text-white shadow"
            )}
            onClick={() => {
              router.push(item.href);
            }}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav >
  );
}

