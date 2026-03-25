import {
  LineChart, Line, XAxis, YAxis,
  ReferenceLine, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function CadenceWidget({ data }) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-[22px] shadow-sm">
        <div className="mb-[14px] font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Cadence
        </div>
        <div className="flex flex-col items-center py-6 gap-2">
          <span style={{ fontSize: 28 }}>📭</span>
          <div className="font-sans text-[12px] text-[var(--color-text-muted)]">No cadence data yet</div>
        </div>
      </div>
    );
  }

  const gap = (data.goal_spm || 180) - (data.avg_spm || 0);
  const gapColor = gap > 5 ? '#F5A623' : '#2ECC8B';

  return (
    <div className="bg-white rounded-2xl p-[22px] shadow-sm">
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
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={data.trend || []}>
          <XAxis
            dataKey="week"
            tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: '#8B93B0' }}
            axisLine={false} tickLine={false}
          />
          <YAxis domain={[160, 190]} hide />
          <ReferenceLine
            y={data.goal_spm || 180} stroke="#E8634A"
            strokeDasharray="4 3" strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
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
