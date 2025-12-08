"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

export const dynamic = "force-dynamic";

const packs = [
  { id: "pack-25", label: "25 créditos", price: "9.99 €", credits: 25, priceId: "price_1SaPjQLsjurCRyLCecx10KUq" },
  { id: "pack-60", label: "60 créditos", price: "19.99 €", credits: 60, priceId: "price_1Sc4fYLsjurCRyLCy1dgKjKs" },
  { id: "pack-120", label: "120 créditos", price: "34.99 €", credits: 120, priceId: "price_1SaPjRLsjurCRyLCevVROX8X" },
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



  // ...

  const checkout = async (packId: string, priceId: string, credits: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setError(null);
      setLoadingId(packId);

      // Create a new checkout session in Firestore
      const docRef = await addDoc(collection(db, "customers", user.uid, "checkout_sessions"), {
        price: priceId, // The extension uses 'price' (Price ID) or 'mode':'payment' + 'price'
        success_url: window.location.origin + "/app?success=1",
        cancel_url: window.location.origin + "/app/credits?canceled=1",
        mode: "payment", // explicitly set mode for one-time payments
        metadata: {
          credits: String(credits), // Pass credits in metadata for webhook fulfillment
          uid: user.uid
        },
      });
      console.log("Checkout session document created:", docRef.id);

      // Wait for the extension to attach the checkout URL
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data() || {};
        if (error) {
          console.error("Stripe Extension Error:", error);
          setError(error.message);
          setLoadingId(null);
          unsubscribe();
        }
        if (url) {
          window.location.assign(url);
          unsubscribe();
        }
      });

    } catch (err) {
      console.error(err);
      setError("Erro ao iniciar pagamento via extensão.");
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#06050b] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-semibold">Comprar créditos</h1>
        <p className="text-sm text-neutral-300">Compra única. Sem subscrição.</p>
        <p className="mt-1 text-xs text-neutral-400">Cada imagem melhorada custa 1 crédito.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {packs.map((pack) => {
            const costPerCredit = (parseFloat(pack.price) / pack.credits).toFixed(2);
            return (
              <div key={pack.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-lg font-semibold">{pack.credits} Créditos</div>
                <div className="text-2xl font-bold">{pack.price}</div>
                <p className="mt-1 text-xs text-neutral-400">{costPerCredit}€ / crédito</p>
                <button
                  className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:brightness-110 disabled:opacity-50"
                  onClick={() => checkout(pack.id, pack.priceId, pack.credits)}
                  disabled={!idToken || loadingId === pack.id}
                >
                  {loadingId === pack.id ? "A abrir checkout..." : "Comprar"}
                </button>
              </div>
            );
          })}
        </div>
        {error ? <div className="mt-4 text-sm text-red-400">{error}</div> : null}
        {!idToken ? <div className="mt-2 text-sm text-yellow-300">Faz login para comprar créditos.</div> : null}
      </div>
    </div>
  );
}

