import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import WidgetEmptyState from './WidgetEmptyState';

const BLUE = '#4A6CF7';

export default function ElevationWidget({ data, stravaConnected, onConnect }) {
  if (!data) {
    return <WidgetEmptyState label="Elevation" title="elevation data" stravaConnected={stravaConnected} onConnect={onConnect} />;
  }

  return (
    <div className="widget-card">
      <div className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em] mb-3.5">
        Elevation
      </div>
      <div className="mb-3.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[34px] font-bold text-navy leading-none">
            {(data.weekly_gain_ft || 0).toLocaleString()}
          </span>
          <span className="font-sans text-[13px] text-[var(--color-text-muted)]">ft gain</span>
        </div>
        <div className="font-sans text-[11px] text-[var(--color-text-muted)] mt-0.5">
          ↓ {(data.weekly_loss_ft || 0).toLocaleString()} ft loss
        </div>
        {data.last_run_gain_ft > 0 && (
          <div className="font-sans text-[11px] text-[var(--color-text-secondary)] mt-0.5">
            Last run: +{data.last_run_gain_ft} ft
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data.trend || []}>
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: 'var(--color-text-muted)' }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
              background: 'var(--color-navy)', border: 'none', borderRadius: 8, color: '#fff',
            }}
            formatter={(v) => [`${v} ft`, 'Gain']}
          />
          <Area type="monotone" dataKey="ft" stroke={BLUE} strokeWidth={2} fill="url(#elevGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
