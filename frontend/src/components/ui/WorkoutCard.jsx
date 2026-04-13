import { LuMapPin as MapPin, LuZap as Zap, LuClock as Clock } from 'react-icons/lu';
import StatusBadge from './StatusBadge';

const typeColors = {
  Easy:         { bg: 'bg-[var(--sage-tint)]',   accent: 'border-l-[var(--color-sage)]',   text: 'text-[var(--color-sage)]' },
  'Long Run':   { bg: 'bg-blue-50',               accent: 'border-l-blue-400',               text: 'text-blue-600' },
  Tempo:        { bg: 'bg-orange-50',              accent: 'border-l-orange-400',             text: 'text-orange-600' },
  Intervals:    { bg: 'bg-[var(--coral-tint)]',   accent: 'border-l-coral',                  text: 'text-coral' },
  Rest:         { bg: 'bg-[var(--color-border-light)]', accent: 'border-l-[var(--color-border)]', text: 'text-[var(--color-text-muted)]' },
  Recovery:     { bg: 'bg-[var(--sage-tint)]',   accent: 'border-l-[var(--color-sage)]',   text: 'text-[var(--color-sage)]' },
  'Cross-Train':{ bg: 'bg-purple-50',             accent: 'border-l-purple-400',             text: 'text-purple-600' },
  Cycling:      { bg: 'bg-sky-50',                accent: 'border-l-sky-400',                text: 'text-sky-600' },
  Swimming:     { bg: 'bg-cyan-50',               accent: 'border-l-cyan-400',               text: 'text-cyan-600' },
};

const statusBadge = {
  planned:   { label: 'Planned',  variant: 'neutral' },
  completed: { label: 'Done',     variant: 'success' },
  missed:    { label: 'Missed',   variant: 'danger' },
  synced:    { label: 'Strava',   variant: 'info' },
  adapted:   { label: 'Adapted',  variant: 'warning' },
};

export default function WorkoutCard({
  type = 'Easy',
  title,
  purpose,
  distance,
  unit = 'mi',
  pace,
  duration,
  status = 'planned',
  source,
  adaptationNote,
  onClick,
}) {
  const colors = typeColors[type] || typeColors.Easy;
  const badge  = statusBadge[status] || statusBadge.planned;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border-l-4 ${colors.bg} ${colors.accent} border border-[var(--color-border-light)] p-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-sm hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider font-sans ${colors.text}`}>
            {type}
          </span>
          <StatusBadge label={badge.label} variant={badge.variant} size="xs" />
        </div>
        {source === 'strava' && (
          <span className="text-[10px] font-bold text-[var(--color-strava)] bg-[var(--color-strava)]/10 px-1.5 py-0.5 rounded-full font-sans">
            S
          </span>
        )}
        {source === 'ai_coach' && (
          <span className="text-[10px] font-bold text-navy bg-navy/10 px-1.5 py-0.5 rounded-full font-sans">
            AI
          </span>
        )}
      </div>

      {title && (
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5 font-heading">
          {title}
        </p>
      )}
      {purpose && (
        <p className="text-[11px] text-[var(--color-text-muted)] mb-2 font-sans">{purpose}</p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-secondary)] font-mono flex-wrap">
        {distance != null && (
          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {distance} {unit}
          </span>
        )}
        {pace && (
          <span className="flex items-center gap-1">
            <Zap size={10} />
            {pace}/mi
          </span>
        )}
        {duration && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {duration}
          </span>
        )}
      </div>

      {adaptationNote && (
        <p className="mt-2 text-[10px] text-[var(--color-warning)] font-sans italic border-t border-[var(--color-border-light)] pt-1.5">
          Adapted: {adaptationNote}
        </p>
      )}
    </div>
  );
}
