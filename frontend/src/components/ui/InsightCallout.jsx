const variantConfig = {
  positive: {
    bg: 'bg-[var(--sage-tint)]',
    border: 'border-[var(--color-sage)]/20',
    dot: 'bg-[var(--color-sage)]',
    text: 'text-[var(--color-sage)]',
  },
  warning: {
    bg: 'bg-[var(--amber-tint)]',
    border: 'border-[var(--color-warning)]/20',
    dot: 'bg-[var(--color-warning)]',
    text: 'text-[var(--color-warning)]',
  },
  neutral: {
    bg: 'bg-[var(--navy-tint)]',
    border: 'border-navy/10',
    dot: 'bg-navy',
    text: 'text-navy',
  },
};

export default function InsightCallout({ text, variant = 'neutral', compact = false }) {
  const cfg = variantConfig[variant] || variantConfig.neutral;
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border ${cfg.bg} ${cfg.border} ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
    >
      <span className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <p className={`text-[12px] font-medium font-sans leading-relaxed ${cfg.text}`}>{text}</p>
    </div>
  );
}
