"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const packs = [
  { id: "pack-25", label: "25 créditos", price: "9.99 €", credits: 25, priceId: "price_25" },
  { id: "pack-60", label: "60 créditos", price: "19.99 €", credits: 60, priceId: "price_60" },
  { id: "pack-100", label: "100 créditos", price: "34.99 €", credits: 100, priceId: "price_100" },
];

export default function CreditsPage() {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getIdToken(user);
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsub();
  }, []);

  const checkout = async (packId: string, priceId: string, credits: number) => {
    try {
      setError(null);
      setLoadingId(packId);
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ priceId, credits }),
      });
      if (!res.ok) throw new Error("Falha no checkout");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao criar sessão de pagamento.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#06050b] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-semibold">Comprar créditos</h1>
        <p className="text-sm text-neutral-300">Compra única. Sem subscrição.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {packs.map((pack) => (
            <div key={pack.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-lg font-semibold">{pack.label}</div>
              <div className="text-sm text-neutral-300">{pack.price}</div>
              <p className="mt-2 text-xs text-neutral-400">{pack.credits} créditos</p>
              <button
                className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:brightness-110 disabled:opacity-50"
                onClick={() => checkout(pack.id, pack.priceId, pack.credits)}
                disabled={!idToken || loadingId === pack.id}
              >
                {loadingId === pack.id ? "A abrir checkout..." : "Comprar"}
              </button>
            </div>
          ))}
        </div>
        {error ? <div className="mt-4 text-sm text-red-400">{error}</div> : null}
        {!idToken ? <div className="mt-2 text-sm text-yellow-300">Faz login para comprar créditos.</div> : null}
      </div>
    </div>
  );
}

