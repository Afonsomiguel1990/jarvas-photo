"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Header } from "@/components/header";
import { SectorCard } from "@/components/ui/sector-card";
import { MobileNav } from "@/components/ui/mobile-nav";
import { getIdToken } from "firebase/auth";

const sectors = [
  { key: "real_estate", title: "Real Estate", description: "Listing premium sem esforço." },
  { key: "food", title: "Food", description: "Mood Michelin instantâneo." },
  { key: "fashion", title: "Fashion", description: "Editorial clean e sofisticado." },
  { key: "product", title: "Product", description: "Catálogo nítido e sem ruído." },
  { key: "portrait", title: "Portrait", description: "Peles naturais, luz equilibrada." },
  { key: "landscape", title: "Landscape", description: "Céus cinematográficos." },
];

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | undefined>();
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      setUserName(user.displayName || user.email || undefined);
      getIdToken(user).then(async (token) => {
        const res = await fetch("/api/user/init", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits ?? 0);
        }
      });
    });
    return () => unsub();
  }, [router]);

  const goToEnhance = (sector: string) => {
    router.push(`/app/enhance?sector=${sector}`);
  };

  return (
    <div className="relative min-h-screen bg-[#07060c] px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Header
          credits={credits}
          userName={userName}
          onLogout={async () => {
            await signOut(auth);
            router.replace("/auth");
          }}
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-300">Escolhe o setor</p>
              <h1 className="text-3xl font-semibold">Processa a tua imagem</h1>
            </div>
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/50"
              onClick={() => router.push("/app/history")}
            >
              Ver histórico
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {sectors.map((sector) => (
              <SectorCard
                key={sector.key}
                title={sector.title}
                description={sector.description}
                onClick={() => goToEnhance(sector.key)}
              />
            ))}
          </div>
        </section>
      </div>
      <MobileNav />
    </div>
  );
}

