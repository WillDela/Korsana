import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';

export default function TrainingLoadWidget({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-[22px] shadow-sm">
        <div className="flex justify-between mb-[14px]">
          <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
            Training Load
          </span>
          <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
        </div>
        <div className="flex flex-col items-center py-6 gap-2">
          <span style={{ fontSize: 28 }}>📭</span>
          <div className="font-sans text-[12px] text-[var(--color-text-muted)]">
            Sync activities to see training load
          </div>
        </div>
      </div>
    );
  }

  const tsbColor = data.tsb > 10
    ? '#2ECC8B'
    : data.tsb >= -10
      ? '#1B2559'
      : data.tsb >= -30 ? '#F5A623' : '#E84A4A';

  return (
    <div className="bg-white rounded-2xl p-[22px] shadow-sm">
      <div className="flex justify-between mb-4">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Training Load
        </span>
        <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
      </div>
      <div className="grid gap-5 items-center mb-4" style={{ gridTemplateColumns: '1fr 1fr 2fr' }}>
        <div>
          <div className="font-mono text-[48px] font-bold leading-none" style={{ color: tsbColor }}>
            {data.tsb > 0 ? '+' : ''}{Math.round(data.tsb)}
          </div>
          <div className="font-sans text-[11px] font-semibold text-navy mt-1">{data.form_label}</div>
          <div className="font-sans text-[10px] text-[var(--color-text-muted)] mt-[2px]">Form (TSB)</div>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="font-mono text-[32px] font-bold text-coral leading-none">
              {Math.round(data.atl)}
            </div>
            <div className="font-sans text-[10px] text-[var(--color-text-muted)]">Fatigue (ATL)</div>
          </div>
          <div>
            <div className="font-mono text-[32px] font-bold text-navy leading-none">
              {Math.round(data.ctl)}
            </div>
            <div className="font-sans text-[10px] text-[var(--color-text-muted)]">Fitness (CTL)</div>
          </div>
          <div
            className="inline-block rounded-full px-2 py-[2px]"
            style={{ background: data.load_ratio > 1.3 ? '#FDE8E3' : '#E8F4EC' }}
          >
            <span
              className="font-mono text-[10px] font-bold"
              style={{ color: data.load_ratio > 1.3 ? '#E8634A' : '#2ECC8B' }}
            >
              {data.load_ratio?.toFixed(2)} ratio
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={data.history || []}>
            <defs>
              <linearGradient id="atlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8634A" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#E8634A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ctlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B2559" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#1B2559" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip contentStyle={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
              background: '#1B2559', border: 'none', borderRadius: 8, color: '#fff',
            }} />
            <Area
              type="monotone" dataKey="atl" stroke="#E8634A"
              strokeWidth={1.5} strokeDasharray="4 2"
              fill="url(#atlGrad)" dot={false} name="Fatigue"
            />
            <Area
              type="monotone" dataKey="ctl" stroke="#1B2559"
              strokeWidth={2} fill="url(#ctlGrad)" dot={false} name="Fitness"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-transparent border-0 font-sans text-[11px] text-[var(--color-text-muted)] cursor-pointer p-0"
      >
        How this works {expanded ? '▴' : '▾'}
      </button>
      {expanded && (
        <div className="mt-[10px] p-[12px_14px] bg-[var(--color-bg-elevated)] rounded-[10px] font-sans text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
          <strong>ATL</strong> (Acute Training Load) = 7-day avg fatigue.{' '}
          <strong>CTL</strong> (Chronic Training Load) = 42-day fitness base.
          <strong> TSB</strong> = CTL - ATL. Positive = fresh, negative = tired.
          Optimal racing: TSB between -10 and +10.
        </div>
      )}
    </div>
  );
}
