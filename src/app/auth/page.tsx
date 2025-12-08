"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      router.push("/app");
    } catch (err) {
      console.error(err);
      setError("Falha ao entrar com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] px-4 py-10 text-white">
      <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <Image src="/favicon.ico" alt="Jarvas" width={40} height={40} />
        </div>
        <h1 className="text-2xl font-semibold">Entrar no Jarvas</h1>
        <p className="text-center text-sm text-neutral-300">
          Usa a tua conta Google para guardar históricos e remover watermark. Trial grátis disponível sem login.
        </p>
        <button
          className="flex w-full items-center justify-center gap-3 rounded-full bg-white text-black px-4 py-3 text-sm font-semibold transition hover:brightness-90 disabled:opacity-50"
          onClick={handleGoogle}
          disabled={loading}
        >
          <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} />
          {loading ? "A entrar..." : "Entrar com Google"}
        </button>
        {error ? <div className="text-sm text-red-400">{error}</div> : null}
        <div className="mt-2 text-xs text-neutral-400">Sem Apple ID nem e-mail. Google apenas.</div>
        <div className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
          <Image src="https://randomuser.me/api/portraits/men/32.jpg" alt="user1" width={28} height={28} className="rounded-full" />
          <Image src="https://randomuser.me/api/portraits/women/44.jpg" alt="user2" width={28} height={28} className="rounded-full" />
          <Image src="https://randomuser.me/api/portraits/men/54.jpg" alt="user3" width={28} height={28} className="rounded-full" />
          <span>+ milhares já a usar</span>
        </div>
      </div>
    </div>
  );
}

