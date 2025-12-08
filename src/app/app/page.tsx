"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Header } from "@/components/header";

import { getIdToken } from "firebase/auth";



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
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">A tua galeria</h1>
            <button
              onClick={() => router.push("/app/enhance")}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:brightness-110"
            >
              + Nova geração
            </button>
          </div>

          <HistoryGallery />
        </section>
      </div>
    </div>
  );
}

function HistoryGallery() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const token = await getIdToken(user);
        const res = await fetch("/api/user/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.generations || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="text-sm text-neutral-400">A carregar...</div>;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-neutral-400">
        Ainda não tens gerações. Cria a tua primeira imagem!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/50">
          <Image
            src={item.imageUrl}
            alt={item.sector}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          <div className="absolute bottom-3 left-3 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            <div className="text-sm font-medium text-white capitalize">{item.sector}</div>
            <div className="text-xs text-neutral-400">{new Date(item.createdAt).toLocaleDateString()}</div>
          </div>
          <a
            href={item.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white backdrop-blur opacity-0 transition hover:bg-white/40 group-hover:opacity-100"
            title="Abrir original"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </a>
        </div>
      ))}
    </div>
  );
}



