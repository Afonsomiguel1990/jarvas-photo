import Link from "next/link";
import { ImageComparison } from "@/components/ui/image-comparison";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SectorCard } from "@/components/ui/sector-card";
import { Badge } from "@/components/ui/simple-badge";

const sectors = [
  { title: "Real Estate", description: "Fotos de imóveis com luz premium." },
  { title: "Food", description: "Mood Michelin para pratos e sobremesas." },
  { title: "Fashion", description: "Editorial limpo para looks e peças." },
  { title: "Product", description: "Catálogo nítido e sem ruído visual." },
  { title: "Portrait", description: "Retratos naturais e suaves." },
  { title: "Landscape", description: "Céus e contrastes cinematográficos." },
];

export default function Home() {
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
            Jarvas · Nano Banana Pro
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Melhora as tuas fotos em segundos</h1>
          <p className="max-w-2xl text-lg text-neutral-200">
            Usa o Gemini (gemini-3-pro-image-preview) para elevar fotos de imóveis, comida, moda e mais. Experimenta grátis
            com watermark ou entra para remover.
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
              Entrar com Google
            </Link>
            <span className="text-sm text-neutral-300">Sem Apple ID. Apenas Google.</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {sectors.slice(0, 3).map((sector) => (
              <SectorCard key={sector.title} title={sector.title} description={sector.description} />
            ))}
          </div>
        </div>

        <section className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-sm text-neutral-300">
              <span>Antes vs Depois</span>
              <Badge variant="outline">Watermark no trial</Badge>
            </div>
            <ImageComparison
              before={{
                src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
                label: "Original",
              }}
              after={{
                src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80&sat=-20&exp=1.2",
                label: "Jarvas",
              }}
            />
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <h2 className="text-2xl font-semibold">Fluxo super simples</h2>
            <ol className="space-y-3 text-neutral-200">
              <li>1. Sobe a foto ou usa a câmara</li>
              <li>2. Escolhe o setor para o prompt ideal</li>
              <li>3. Recebe a versão pro. Trial com watermark</li>
              <li>4. Faz download sem watermark ao entrar</li>
            </ol>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-neutral-300">
              <div className="mb-2 text-white">Créditos por compra</div>
              <p>Compra pacotes quando precisares. Sem mensalidade.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge>Setores</Badge>
            <span className="text-sm text-neutral-300">Escolhe um e começa</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sectors.map((sector) => (
              <SectorCard key={sector.title} title={sector.title} description={sector.description} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
