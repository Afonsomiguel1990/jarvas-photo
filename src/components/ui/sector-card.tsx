import { Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type SectorCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  favorite?: boolean;
  onClick?: () => void;
  onToggleFavorite?: () => void;
};

export function SectorCard({ title, description, icon, favorite, onClick, onToggleFavorite }: SectorCardProps) {
  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-white/30"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
          {icon || <Sparkles className="h-5 w-5" />}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className={cn(
            "rounded-full p-2 text-white/70 transition hover:text-white",
            favorite ? "bg-white/20 text-amber-300" : "bg-white/10"
          )}
        >
          <Star className={cn("h-4 w-4", favorite && "fill-amber-300 text-amber-300")} />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-neutral-300">{description}</p>
      </div>
      <div className="text-xs font-medium text-white/70">Selecionar setor</div>
    </div>
  );
}

