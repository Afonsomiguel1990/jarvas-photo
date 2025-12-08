"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

export default function EnhancePage() {
  const searchParams = useSearchParams();
  const sector = searchParams.get("sector") || "real_estate";
  const [base64, setBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<EnhanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

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
        throw new Error("Falha ao gerar imagem.");
      }
      const data = (await res.json()) as EnhanceResponse;
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao processar a imagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#06050b] px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary">Setor {sectorLabel}</Badge>
            <h1 className="text-3xl font-semibold">Melhorar imagem</h1>
            <p className="text-sm text-neutral-300">Trial mostra watermark. Entrar remove watermark e desconta 1 crédito.</p>
          </div>
          <button
            onClick={handleEnhance}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:brightness-110 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "A processar..." : "Gerar com Jarvas"}
          </button>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <FileUpload onChange={handleFiles} label="Carrega a tua imagem" subtitle="Formatos: JPG, PNG" />
            {preview ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <Image src={preview} alt="preview" width={800} height={800} className="h-full w-full object-cover" />
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <LumaSpin />
                <p className="text-sm text-neutral-300">A criar a tua imagem...</p>
              </div>
            ) : result?.enhancedUrl && preview ? (
              <div className="w-full">
                <ImageComparison
                  before={{ src: preview, label: "Original" }}
                  after={{ src: result.enhancedUrl, label: result.isTrial ? "Jarvas · Trial" : "Jarvas" }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-neutral-300">
                    {result.isTrial
                      ? "Resultado com watermark. Entra para remover e descarregar."
                      : "Pronto a descarregar sem watermark."}
                  </p>
                  {!result.isTrial ? (
                    <a
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50"
                      href={result.enhancedUrl}
                      download
                    >
                      Download
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-300">Sobe uma imagem para ver o resultado lado a lado.</p>
            )}
            {error ? <div className="mt-3 text-sm text-red-400">{error}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

