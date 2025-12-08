"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("register");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

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

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/app");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este email já está a ser usado.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Email ou password incorretos.");
      } else {
        setError("Falha na autenticação. Tenta novamente.");
      }
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
        <h1 className="text-2xl font-semibold">
          {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
        </h1>

        <div className="flex w-full gap-2 rounded-lg bg-neutral-900/50 p-1">
          <button
            onClick={() => setMode("register")}
            className={cn("flex-1 rounded-md py-2 text-sm font-medium transition", mode === "register" ? "bg-white text-black shadow" : "text-neutral-400 hover:text-white")}
          >
            Registar
          </button>
          <button
            onClick={() => setMode("login")}
            className={cn("flex-1 rounded-md py-2 text-sm font-medium transition", mode === "login" ? "bg-white text-black shadow" : "text-neutral-400 hover:text-white")}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleEmail} className="flex w-full flex-col gap-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Nome"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-white/30 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "A processar..." : (mode === "register" ? "Criar conta" : "Entrar")}
          </button>
        </form>

        <div className="relative flex w-full items-center gap-2 text-xs text-neutral-500">
          <div className="h-px flex-1 bg-white/10"></div>
          OU
          <div className="h-px flex-1 bg-white/10"></div>
        </div>

        <button
          className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          onClick={handleGoogle}
          disabled={loading}
        >
          <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} />
          {loading ? "A processar..." : "Continuar com Google"}
        </button>

        {error ? <div className="text-sm text-red-400">{error}</div> : null}

        <div className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
          <Image src="https://randomuser.me/api/portraits/men/32.jpg" alt="user1" width={28} height={28} className="rounded-full" />
          <Image src="https://randomuser.me/api/portraits/women/44.jpg" alt="user2" width={28} height={28} className="rounded-full" />
          <Image src="https://randomuser.me/api/portraits/men/54.jpg" alt="user3" width={28} height={28} className="rounded-full" />
          <span>dezenas de empreendedores usam a app do Jarvas para melhorar as suas fotografias todos os dias.</span>
        </div>
      </div>
    </div>
  );
}

