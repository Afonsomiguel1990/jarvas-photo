import { useState } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/simple-badge";

type ImageComparisonProps = {
  before: { src: string; alt?: string; label?: string };
  after: { src: string; alt?: string; label?: string };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ImageComparison({ before, after }: ImageComparisonProps) {
  const [inset, setInset] = useState<number>(50);
  const [dragging, setDragging] = useState<boolean>(false);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    let x = 0;
    if ("touches" in e && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
    } else if ("clientX" in e) {
      x = e.clientX - rect.left;
    }
    const percentage = clamp((x / rect.width) * 100, 0, 100);
    setInset(percentage);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e0d14] select-none">
      <div className="absolute left-3 top-3 z-30 flex gap-2">
        {before.label ? <Badge variant="outline">{before.label}</Badge> : null}
        {after.label ? <Badge>{after.label}</Badge> : null}
      </div>
      <div
        className="relative h-full w-full"
        onMouseMove={handleMove}
        onMouseUp={() => setDragging(false)}
        onTouchMove={handleMove}
        onTouchEnd={() => setDragging(false)}
      >
        <div
          className="bg-white/40 h-full w-1 absolute z-20 top-0 -ml-1"
          style={{ left: `${inset}%` }}
        >
          <button
            className="bg-white text-black rounded shadow transition-all w-6 h-12 -translate-y-1/2 absolute top-1/2 -ml-2 z-30 cursor-ew-resize flex justify-center items-center"
            onTouchStart={(e) => {
              setDragging(true);
              handleMove(e);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setDragging(true);
              handleMove(e);
            }}
            onTouchEnd={() => setDragging(false)}
            onMouseUp={() => setDragging(false)}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
        <Image
          src={after.src}
          alt={after.alt || "after"}
          fill
          sizes="100vw"
          className="absolute left-0 top-0 z-10 h-full w-full object-cover"
          style={{ clipPath: `inset(0 0 0 ${inset}% )` }}
          priority
        />
        <Image
          src={before.src}
          alt={before.alt || "before"}
          fill
          sizes="100vw"
          className="absolute left-0 top-0 h-full w-full object-cover"
          priority
        />
      </div>
    </div>
  );
}

