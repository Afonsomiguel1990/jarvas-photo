"use client";

import { useMemo, useState } from "react";
import { Home, Camera, CreditCard, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ElementType<{ className?: string }>;
  onClick?: () => void;
};

type MobileNavProps = {
  items?: NavItem[];
};

const defaultItems: NavItem[] = [
  { label: "Home", icon: Home },
  { label: "Enhance", icon: Camera },
  { label: "Créditos", icon: CreditCard },
  { label: "Histórico", icon: Clock },
  { label: "Perfil", icon: Settings },
];

export function MobileNav({ items }: MobileNavProps) {
  const finalItems = useMemo(() => {
    if (!items || items.length < 2) return defaultItems;
    return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);

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
              setActiveIndex(index);
              item.onClick?.();
            }}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

