"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CreditBadge } from "@/components/ui/credit-badge";

type HeaderProps = {
  credits?: number;
  userName?: string;
  onLogin?: () => void;
  onLogout?: () => void;
};

export function Header({ credits = 0, userName, onLogin, onLogout }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/10">
          <Image src="/favicon.ico" alt="Jarvas" fill sizes="40px" className="object-cover" />
        </div>
        <div>
          <div className="text-sm text-neutral-300">Jarvas</div>
          <div className="text-base font-semibold text-white">Image Enhancer</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <CreditBadge credits={credits} />
        {userName ? (
          <button
            className="rounded-full bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
            onClick={onLogout}
          >
            Sair
          </button>
        ) : (
          <button
            className="rounded-full bg-primary px-3 py-2 text-sm text-primary-foreground transition hover:brightness-110"
            onClick={() => (onLogin ? onLogin() : router.push("/auth"))}
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}

