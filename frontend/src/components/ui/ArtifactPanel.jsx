import { LuCompass as Compass, LuChartColumnBig as BarChart2, LuDumbbell as Dumbbell, LuCalendar as Calendar, LuTarget as Target, LuFlag as Flag, LuHeart as Heart } from 'react-icons/lu';

const artifactConfig = {
  daily_brief:        { Icon: Compass,   color: 'text-[var(--color-info)]',    bg: 'bg-[rgba(74,108,247,0.10)]', label: 'Daily Brief' },
  weekly_review:      { Icon: BarChart2, color: 'text-[var(--color-sage)]',    bg: 'bg-[var(--sage-tint)]',      label: 'Weekly Review' },
  workout_adjustment: { Icon: Dumbbell,  color: 'text-[var(--color-warning)]', bg: 'bg-[var(--amber-tint)]',     label: 'Workout Adjustment' },
  plan_preview:       { Icon: Calendar,  color: 'text-navy',                   bg: 'bg-navy/10',                 label: 'Plan Preview' },
  goal_feasibility:   { Icon: Target,    color: 'text-coral',                  bg: 'bg-[var(--coral-tint)]',     label: 'Goal Feasibility' },
  race_strategy:      { Icon: Flag,      color: 'text-coral',                  bg: 'bg-[var(--coral-tint)]',     label: 'Race Strategy' },
  recovery_note:      { Icon: Heart,     color: 'text-[var(--color-danger)]',  bg: 'bg-[rgba(232,74,74,0.10)]',  label: 'Recovery Note' },
};

export default function ArtifactPanel({ type = 'daily_brief', title, timestamp, confidence, children }) {
  const cfg = artifactConfig[type] || artifactConfig.daily_brief;
  const { Icon } = cfg;
  const dateStr = timestamp
    ? new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-light)] bg-[var(--color-bg-elevated)]">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
            <Icon size={14} className={cfg.color} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans">
              {cfg.label}
            </p>
            {title && (
              <p className="text-sm font-semibold text-navy font-heading leading-tight">{title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          {confidence != null && (
            <span className="text-[10px] font-mono font-semibold text-[var(--color-text-muted)]">
              {Math.round(confidence * 100)}% confidence
            </span>
          )}
          {dateStr && (
            <span className="text-[10px] text-[var(--color-text-muted)] font-sans">{dateStr}</span>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
