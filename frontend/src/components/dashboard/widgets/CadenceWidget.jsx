import {
  LineChart, Line, XAxis, YAxis,
  ReferenceLine, Tooltip, ResponsiveContainer,
} from 'recharts';
import DataEmptyState from '../../ui/DataEmptyState';
import { chartTheme } from '../../../lib/chartTheme';

export default function CadenceWidget({ data, stravaConnected, onConnect }) {
  if (!data) {
    return (
      <div className="widget-card">
        <div className="flex justify-between mb-4">
          <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">Cadence</span>
          <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
        </div>
        <DataEmptyState
          variant={stravaConnected === false ? 'strava' : 'nodata'}
          title={stravaConnected === false ? 'Connect Strava' : 'No cadence data yet'}
          description={stravaConnected === false ? 'Connect to see your cadence data' : 'Sync activities to get started'}
          action={stravaConnected === false ? { label: 'Connect Strava', onClick: onConnect } : undefined}
        />
      </div>
    );
  }

  const gap = (data.goal_spm || 180) - (data.avg_spm || 0);
  const gapColor = gap > 5 ? '#F5A623' : '#2ECC8B';

  return (
    <div className="widget-card">
      <div className="mb-[10px] font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
        Cadence
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-mono text-[34px] font-bold text-navy leading-none">
          {data.avg_spm || '--'}
        </span>
        <span className="font-sans text-[13px] text-[var(--color-text-muted)]">spm avg</span>
      </div>
      <div className="font-sans text-[11px] mb-3" style={{ color: gapColor }}>
        Goal: {data.goal_spm || 180} spm ·{' '}
        {gap > 0 ? `${gap} away` : 'On target ✓'}
      </div>
      {data.by_activity?.length > 0 && (
        <div className="flex gap-[6px] mb-3">
          {data.by_activity.map((a, i) => (
            <div key={i} className="flex-1 bg-[var(--color-bg-elevated)] rounded-lg py-[7px] px-1 text-center">
              <div className="font-mono text-[13px] font-bold text-navy">{a.spm}</div>
              <div className="font-sans text-[9px] text-[var(--color-text-muted)] mt-[1px]">{a.type}</div>
            </div>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data.trend || []}>
          <XAxis
            dataKey="week"
            tick={chartTheme.axis.tick}
            axisLine={false} tickLine={false}
          />
          <YAxis domain={[160, 190]} hide />
          <ReferenceLine
            y={data.goal_spm || 180} stroke="#E8634A"
            strokeDasharray="4 3" strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{
              ...chartTheme.tooltip.style,
              background: '#1B2559', border: 'none', borderRadius: 8, color: '#fff',
            }}
            formatter={(v) => [`${v} spm`, 'Cadence']}
          />
          <Line type="monotone" dataKey="spm" stroke="#2ECC8B" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
