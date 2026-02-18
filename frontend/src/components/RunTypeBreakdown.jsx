import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  easy: { color: '#5B8C3E', label: 'Easy' },
  tempo: { color: '#E5A830', label: 'Tempo' },
  speed: { color: '#E8725A', label: 'Speed' },
  long: { color: '#1B2559', label: 'Long' },
};

const RunTypeBreakdown = ({ activities = [], targetPaceSecondsPerKm }) => {
  const breakdown = useMemo(() => {
    if (activities.length === 0) return [];

    const counts = { easy: 0, tempo: 0, speed: 0, long: 0 };

    // Default target pace if none provided: 6 min/km
    const target = targetPaceSecondsPerKm || 360;

    activities.forEach((a) => {
      const distMiles = (a.distance_meters || 0) * 0.000621371;
      const pace = a.average_pace_seconds_per_km;

      // Long run: distance > 8 miles regardless of pace
      if (distMiles > 8) {
        counts.long++;
      } else if (pace && pace > target * 1.2) {
        counts.easy++;
      } else if (pace && pace >= target * 0.95 && pace <= target * 1.05) {
        counts.tempo++;
      } else if (pace && pace < target * 0.95) {
        counts.speed++;
      } else {
        counts.easy++; // default
      }
    });

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        name: COLORS[type].label,
        value: count,
        color: COLORS[type].color,
      }));
  }, [activities, targetPaceSecondsPerKm]);

  if (breakdown.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Run Type Breakdown
        </h3>
        <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
          No activity data yet
        </div>
      </div>
    );
  }

  const total = breakdown.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Run Type Breakdown
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                dataKey="value"
                stroke="none"
              >
                {breakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} runs (${Math.round((value / total) * 100)}%)`, name]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8125rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {breakdown.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-text-primary font-medium">{item.name}</span>
              <span className="text-sm text-text-muted font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RunTypeBreakdown;
