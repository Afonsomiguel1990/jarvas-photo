"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { FileUpload } from "@/components/ui/file-upload";
import { LumaSpin } from "@/components/ui/luma-spin";
import { ImageComparison } from "@/components/ui/image-comparison";
import { Badge } from "@/components/ui/simple-badge";

type EnhanceResponse = { enhancedUrl: string; isTrial: boolean };

const sectorCopy: Record<string, string> = {
  real_estate: "Real Estate",
  food: "Food",
  fashion: "Fashion",
  product: "Product",
  portrait: "Portrait",
  landscape: "Landscape",
};

import { Suspense } from "react";

function EnhanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sector = searchParams.get("sector") || "real_estate";
  const [base64, setBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<EnhanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getIdToken(user);
        setIdToken(token);
        // Fetch credits
        fetch("/api/user/init", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setCredits(data.credits))
          .catch(console.error);
      } else {
        setIdToken(null);
        setCredits(null);
      }
    });
    return () => unsub();
  }, []);

  const sectorLabel = useMemo(() => sectorCopy[sector] || sector, [sector]);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setBase64(resultStr);
      setPreview(resultStr);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    if (!base64) {
      setError("Carrega uma imagem primeiro.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ image: base64, sector }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao gerar imagem.");
      }
      const data = (await res.json()) as EnhanceResponse;
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao processar a imagem.");
    } finally {
      setLoading(false);
    }
  };

  const sectors = [
    { id: "real_estate", label: "Imobiliário", image: "/examples/casa-antes.webp" },
    { id: "food", label: "Doces", image: "/examples/Bolo1-antes.webp" },
    { id: "restaurant", label: "Restauração", image: "/examples/comida1-antes.webp" },
    { id: "fashion", label: "Moda", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80" },
    { id: "product", label: "Produto", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80" },
    { id: "portrait", label: "Retrato", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80" },
    { id: "landscape", label: "Paisagem", image: "/examples/casa-antes.webp" },
  ];

  return (
    <div className="relative min-h-screen bg-[#06050b] px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Melhorar imagem</h1>
            <Badge variant="secondary">
              {credits !== null ? `${credits} Créditos` : "..."}
            </Badge>
          </div>

          <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {sectors.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/app/enhance?sector=${s.id}`)}
                className={`relative flex h-24 w-32 flex-none flex-col items-center justify-center overflow-hidden rounded-xl border transition hover:opacity-100 ${sector === s.id ? "border-primary opacity-100 ring-2 ring-primary/50" : "border-white/10 opacity-60 hover:border-white/30"
                  }`}
              >
                <Image src={s.image} alt={s.label} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40" />
                <span className="relative z-10 text-xs font-medium text-white">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
          Carrega a imagem para o setor <b>{sectorCopy[sector] || sectors.find(s => s.id === sector)?.label || sector}</b>.
        </div>
        {/* Main Content Area */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          {error ? (
            <div className="p-4 text-center text-red-400">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="mt-2 text-sm underline">Tentar de novo</button>
            </div>
          ) : null}

          {result?.enhancedUrl && preview ? (
            // Result View
            <div className="p-4">
              <ImageComparison
                before={{ src: preview, label: "Original" }}
                after={{ src: result.enhancedUrl, label: result.isTrial ? "Jarvas · Trial" : "Jarvas" }}
              />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-neutral-300">
                  {result.isTrial ? "Com watermark." : "Sem watermark."}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => { setPreview(null); setResult(null); setBase64(null); }} className="rounded-full px-4 py-2 text-sm hover:bg-white/10">
                    Nova
                  </button>
                  {!result.isTrial && (
                    <button
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:brightness-110"
                      onClick={async () => {
                        try {
                          const res = await fetch(result.enhancedUrl);
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `jarvas-enhanced-${Date.now()}.png`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (e) {
                          console.error("Download failed", e);
                          window.open(result.enhancedUrl, '_blank');
                        }
                      }}
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : preview ? (
            // Preview & Loading View
            <div className="relative flex flex-col items-center p-4">
              <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-xl border border-white/10 md:aspect-[4/3]">
                <Image src={preview} alt="preview" fill className="object-contain" />
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <LumaSpin />
                    <p className="mt-4 text-sm font-medium text-white">A criar magia...</p>
                  </div>
                )}
              </div>

              {!loading && (
                <div className="mt-6 flex w-full justify-center gap-3">
                  <button onClick={() => { setPreview(null); setBase64(null); }} className="rounded-full px-6 py-2 text-sm font-medium hover:bg-white/10">
                    Trocar imagem
                  </button>
                  <button
                    onClick={handleEnhance}
                    className="rounded-full bg-primary px-8 py-2 text-sm font-semibold text-primary-foreground shadow hover:brightness-110"
                  >
                    Melhorar
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Upload View
            <div className="p-8">
              <FileUpload onChange={handleFiles} label="Carrega a tua imagem" subtitle="Formatos: JPG, PNG" />
            </div>
          )}
        </section>
      </div >
    </div >
  );
}

export default function EnhancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06050b] p-8 text-white">A carregar...</div>}>
      <EnhanceContent />
    </Suspense>
  );
}

