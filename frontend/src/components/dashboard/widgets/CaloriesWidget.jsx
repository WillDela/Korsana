import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import DataEmptyState from '../../ui/DataEmptyState';
import { chartTheme } from '../../../lib/chartTheme';

export default function CaloriesWidget({ data, stravaConnected, onConnect }) {
  if (!data) {
    return (
      <div className="widget-card">
        <div className="flex justify-between mb-4">
          <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">Calories Burned</span>
          <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
        </div>
        <DataEmptyState
          variant={stravaConnected === false ? 'strava' : 'nodata'}
          title={stravaConnected === false ? 'Connect Strava' : 'No calorie data yet'}
          description={stravaConnected === false ? 'Connect to see your calorie data' : 'Sync activities to get started'}
          action={stravaConnected === false ? { label: 'Connect Strava', onClick: onConnect } : undefined}
        />
      </div>
    );
  }

  const pct = Math.min(
    100,
    Math.round(((data.weekly_burn || 0) / (data.weekly_target || 2000)) * 100)
  );

  return (
    <div className="widget-card">
      <div className="mb-3 font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
        Calories Burned
      </div>
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="font-mono text-[34px] font-bold text-navy leading-none">
            {(data.weekly_burn || 0).toLocaleString()}
          </span>
          <span className="font-sans text-[13px] text-[var(--color-text-muted)]">
            {' '}/ {(data.weekly_target || 0).toLocaleString()} kcal
          </span>
        </div>
        <span
          className="font-mono text-[14px] font-bold"
          style={{ color: pct >= 80 ? '#2ECC8B' : '#F5A623' }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-[8px] bg-[var(--color-border-light)] rounded-full overflow-hidden mb-[14px]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#F5A623,#E8634A)' }}
        />
      </div>
      {data.per_run_avg > 0 && (
        <div className="font-sans text-[11px] text-[var(--color-text-muted)] mb-[10px]">
          ~{Math.round(data.per_run_avg)} kcal per run
        </div>
      )}
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data.trend || []} barSize={14}>
          <XAxis
            dataKey="week"
            tick={chartTheme.axis.tick}
            axisLine={false} tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              ...chartTheme.tooltip.style,
              background: '#1B2559', border: 'none', borderRadius: 8, color: '#fff',
            }}
            formatter={(v) => [`${v} kcal`, 'Burned']}
          />
          <Bar dataKey="kcal" radius={[3, 3, 0, 0]}>
            {(data.trend || []).map((_, i) => (
              <Cell
                key={i}
                fill={i === (data.trend?.length || 0) - 1 ? '#F5A623' : '#1B2559'}
                fillOpacity={i === (data.trend?.length || 0) - 1 ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
