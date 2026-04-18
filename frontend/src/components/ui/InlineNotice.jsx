const VARIANT_STYLES = {
  info: 'border-[rgba(27,37,89,0.12)] bg-[var(--navy-tint)] text-navy',
  success: 'border-[rgba(46,204,139,0.24)] bg-[rgba(46,204,139,0.10)] text-[var(--color-success)]',
  error: 'border-[rgba(232,74,74,0.20)] bg-[rgba(232,74,74,0.08)] text-[var(--color-danger)]',
  warning: 'border-[rgba(229,168,48,0.24)] bg-[rgba(229,168,48,0.10)] text-[var(--color-warning)]',
};

export default function InlineNotice({ variant = 'info', children, className = '' }) {
  if (!children) return null;

  return (
    <div
      role="status"
      className={`rounded-lg border px-3 py-2 text-sm font-medium ${VARIANT_STYLES[variant] || VARIANT_STYLES.info} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
