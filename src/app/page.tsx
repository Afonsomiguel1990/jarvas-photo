"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageComparison } from "@/components/ui/image-comparison";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Badge } from "@/components/ui/simple-badge";
import { cn } from "@/lib/utils";

const examples = {
  real_estate: {
    label: "Imobiliário",
    before: "/examples/casa-antes.webp",
    after: "/examples/casa-depois.webp",
    aspect: "aspect-[3/4]",
  },
  food: {
    label: "Doces",
    before: "/examples/Bolo1-antes.webp",
    after: "/examples/Bolo1-depois.webp",
    aspect: "aspect-[3/4]",
  },
  restaurant: {
    label: "Restauração",
    before: "/examples/comida1-antes.webp",
    after: "/examples/comida2-depois.webp",
    aspect: "aspect-[3/4]",
  },

};

export default function Home() {
  const [selected, setSelected] = useState<keyof typeof examples>("real_estate");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0">
        <GradientBackground
          gradientOrigin="center"
          colors={[
            { color: "rgba(26,20,50,1)", stop: "0%" },
            { color: "rgba(76,17,88,1)", stop: "25%" },
            { color: "rgba(142,68,173,1)", stop: "50%" },
            { color: "rgba(233,30,99,1)", stop: "75%" },
            { color: "rgba(255,110,199,1)", stop: "100%" },
          ]}
          gradientSize="140% 140%"
          noiseIntensity={0.8}
          noisePatternSize={110}
          className="opacity-80"
        />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-4 pb-24 pt-16">
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <Badge variant="secondary" className="w-fit">
            Jarvas AI
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Melhora qualquer foto, atraí mais clientes.</h1>
          <p className="max-w-2xl text-lg text-neutral-200">
            Experimenta grátis.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app/enhance"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110"
            >
              Experimentar grátis
            </Link>
            <Link
              href="/auth"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/50"
            >
              Registar ou Login
            </Link>
          </div>
        </div>

        <section className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(examples) as Array<keyof typeof examples>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                    selected === key
                      ? "bg-white text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {examples[key].label}
                </button>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between text-sm text-neutral-300">
              <span>Antes vs Depois</span>
            </div>
            <ImageComparison
              className={examples[selected].aspect}
              before={{
                src: examples[selected].before,
                label: "Original",
              }}
              after={{
                src: examples[selected].after,
                label: "Jarvas AI",
              }}
            />
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <h2 className="text-2xl font-semibold">Como funciona</h2>
            <ol className="space-y-4 text-neutral-200">
              <li>1. Carrega a tua foto</li>
              <li>2. A IA analisa e melhora os detalhes</li>
              <li>3. Vê a transformação automática</li>
              <li>4. Descarrega em alta resolução</li>
            </ol>
            <div className="mt-auto flex flex-col gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-neutral-300">
                <div className="mb-1 font-medium text-white">Pagamento flexível</div>
                <p>Compra créditos quando precisares. Sem mensalidades.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-neutral-300">
                <div className="mb-1 font-medium text-white">Rápido e Simples</div>
                <p>Transformação em segundos. Não requer conhecimentos de edição.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="flex flex-col gap-8">
          <h2 className="text-center text-3xl font-semibold">O que dizem os nossos clientes</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Hélder",
                text: "Como consultor imobiliário, a qualidade da imagem é tudo. O Jarvas transforma fotos de telemóvel em catálogo de luxo. Vendo as casas muito mais rápido!",
                stars: 5,
              },
              {
                name: "Joana",
                text: "Incrível para dar vida às fotos dos meus pratos! Antes as fotos ficavam escuras e sem graça, agora parecem tiradas num estúdio profissional. Os meus clientes notaram logo a diferença!",
                stars: 5,
              },
              {
                name: "Artur",
                text: "Transforma qualquer foto banal numa imagem de luxo. Simples, rápido e com um suporte 5 estrelas.",
                stars: 4,
              },
            ].map((testimonial, i) => (
              <div key={i} className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur transition hover:bg-white/10">
                <div className="flex flex-col gap-2">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={i < testimonial.stars ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-neutral-300">"{testimonial.text}"</p>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-semibold">{testimonial.name}</span>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    COMPRA VERIFICADA
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
