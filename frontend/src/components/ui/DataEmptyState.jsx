import { LuActivity as Activity, LuTarget as Target, LuAlertCircle as AlertCircle, LuLoader2 as Loader2 } from 'react-icons/lu';
import BrandIcon from '../BrandIcon';

const variantConfig = {
  strava: {
    Icon: null,
    iconBg: 'bg-[var(--color-strava)]/10',
  },
  nodata: {
    Icon: Activity,
    iconBg: 'bg-[var(--color-border-light)]',
    iconColor: 'text-[var(--color-text-muted)]',
  },
  nogoal: {
    Icon: Target,
    iconBg: 'bg-navy/8',
    iconColor: 'text-navy',
  },
  error: {
    Icon: AlertCircle,
    iconBg: 'bg-[rgba(232,74,74,0.10)]',
    iconColor: 'text-[var(--color-danger)]',
  },
  loading: {
    Icon: Loader2,
    iconBg: 'bg-navy/8',
    iconColor: 'text-navy',
  },
};

export default function DataEmptyState({ title, description, action, variant = 'nodata' }) {
  const cfg = variantConfig[variant] || variantConfig.nodata;
  const { Icon } = cfg;

  return (
    <div className="flex flex-col items-center py-8 px-4 gap-3 text-center">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
        {variant === 'strava' ? (
          <BrandIcon brand="strava" size={22} />
        ) : Icon ? (
          <Icon
            size={22}
            className={`${cfg.iconColor} ${variant === 'loading' ? 'animate-spin' : ''}`}
          />
        ) : null}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1 font-heading">
          {title}
        </p>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] max-w-[240px] font-sans">
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 px-4 py-2 rounded-lg text-white text-xs font-bold border-none cursor-pointer transition-colors bg-navy hover:bg-navy-light font-sans"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
