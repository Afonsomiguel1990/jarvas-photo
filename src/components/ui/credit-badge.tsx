type CreditBadgeProps = {
  credits: number;
};

export function CreditBadge({ credits }: CreditBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white shadow-sm">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      <span>{credits} créditos</span>
    </div>
  );
}

