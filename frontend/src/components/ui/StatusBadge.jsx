const variantConfig = {
  success: {
    bg: 'bg-[rgba(46,204,139,0.12)]',
    text: 'text-[var(--color-success)]',
    dot: 'bg-[var(--color-success)]',
  },
  warning: {
    bg: 'bg-[rgba(229,168,48,0.12)]',
    text: 'text-[var(--color-warning)]',
    dot: 'bg-[var(--color-warning)]',
  },
  danger: {
    bg: 'bg-[rgba(232,74,74,0.10)]',
    text: 'text-[var(--color-danger)]',
    dot: 'bg-[var(--color-danger)]',
  },
  info: {
    bg: 'bg-[rgba(74,108,247,0.10)]',
    text: 'text-[var(--color-info)]',
    dot: 'bg-[var(--color-info)]',
  },
  neutral: {
    bg: 'bg-[var(--color-border-light)]',
    text: 'text-[var(--color-text-secondary)]',
    dot: 'bg-[var(--color-text-muted)]',
  },
  navy: {
    bg: 'bg-navy/10',
    text: 'text-navy',
    dot: 'bg-navy',
  },
  coral: {
    bg: 'bg-coral/10',
    text: 'text-coral',
    dot: 'bg-coral',
  },
};

const sizeConfig = {
  xs: { badge: 'px-1.5 py-0.5 text-[10px] gap-1', dot: 'w-1 h-1' },
  sm: { badge: 'px-2 py-0.5 text-[11px] gap-1', dot: 'w-1.5 h-1.5' },
  md: { badge: 'px-2.5 py-1 text-xs gap-1.5', dot: 'w-2 h-2' },
};

export default function StatusBadge({ label, variant = 'neutral', size = 'sm', dot = false }) {
  const v = variantConfig[variant] || variantConfig.neutral;
  const s = sizeConfig[size] || sizeConfig.sm;

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold font-sans tracking-wide ${v.bg} ${v.text} ${s.badge}`}
    >
      {dot && <span className={`rounded-full shrink-0 ${v.dot} ${s.dot}`} />}
      {label}
    </span>
  );
}
