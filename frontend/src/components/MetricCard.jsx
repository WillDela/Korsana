import AnimatedNumber from './AnimatedNumber';

const MetricCard = ({ label, value, decimals = 0, suffix = '', subtext, subtextColor, icon, children }) => {
  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>

      {children || (
        <div className="text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </div>
      )}

      {subtext && (
        <p className="text-xs font-medium mt-2" style={{ color: subtextColor || 'var(--color-text-secondary)' }}>
          {subtext}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
