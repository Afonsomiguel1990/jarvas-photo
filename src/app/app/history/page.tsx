"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type Generation = { id: string; imageUrl: string; sector: string; createdAt: string };

export default function HistoryPage() {
  const [items, setItems] = useState<Generation[]>([]);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const token = await getIdToken(user);
      setIdToken(token);
      // placeholder: fetch history endpoint if exists
      setItems([]);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#06050b] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-semibold">Histórico</h1>
        <p className="text-sm text-neutral-300">Últimas imagens geradas.</p>
        {items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-neutral-300">
            Sem items ainda. Gera a tua primeira imagem.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-lg">
                  <Image src={item.imageUrl} alt={item.sector} fill sizes="300px" className="object-cover" />
                </div>
                <div className="text-sm font-semibold">{item.sector}</div>
                <div className="text-xs text-neutral-400">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
        {!idToken ? <div className="mt-4 text-sm text-yellow-300">Faz login para veres o histórico.</div> : null}
      </div>
    </div>
  );
}

