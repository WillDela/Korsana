import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const secsToMinSec = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const PaceTrendChart = ({ activities = [], goalPace }) => {
  const data = useMemo(() => {
    if (activities.length === 0) return [];

    const now = new Date();
    const weekMap = {};

    for (let w = 7; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - w * 7);
      start.setHours(0, 0, 0, 0);
      const key = start.toISOString().slice(0, 10);
      weekMap[key] = { label: `W${8 - w}`, paces: [] };
    }

    activities.forEach((a) => {
      if (a.activity_type !== 'run' || !a.distance_meters || !a.duration_seconds) return;
      const paceSecPerMile = a.duration_seconds / (a.distance_meters / 1609.34);
      const d = new Date(a.start_time);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString().slice(0, 10);
      if (weekMap[key]) weekMap[key].paces.push(paceSecPerMile);
    });

    return Object.values(weekMap)
      .map((w) => ({
        week: w.label,
        pace: w.paces.length > 0
          ? w.paces.reduce((a, b) => a + b, 0) / w.paces.length
          : null,
      }))
      .filter((w) => w.pace !== null);
  }, [activities]);

  if (data.length === 0) {
    return (
      <div className="card p-5">
        <h3
          className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Pace Trend
        </h3>
        <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
          No pace data yet
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3
        className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Pace Trend
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={secsToMinSec}
              domain={['auto', 'auto']}
              reversed
            />
            <Tooltip
              formatter={(v) => [secsToMinSec(v), 'Avg Pace']}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8125rem' }}
            />
            <Line type="monotone" dataKey="pace" stroke="var(--color-navy)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            {goalPace && (
              <ReferenceLine y={goalPace} stroke="var(--color-coral)" strokeDasharray="6 4" label={{ value: 'Goal', fill: 'var(--color-coral)', fontSize: 11 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PaceTrendChart;
