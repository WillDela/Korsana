import { useMemo } from 'react';

const ZONES = [
  { zone: 'Z1', type: 'Recovery', color: '#5B8C3E', bg: 'bg-sage/10', text: 'text-sage' },
  { zone: 'Z2', type: 'Aerobic', color: '#E5A830', bg: 'bg-amber/10', text: 'text-amber' },
  { zone: 'Z3', type: 'Threshold', color: '#1B2559', bg: 'bg-navy/10', text: 'text-navy', highlight: true },
  { zone: 'Z4', type: 'VO2 Max', color: '#E8725A', bg: 'bg-coral/10', text: 'text-coral' },
];

const PhysiologyZones = ({ currentPace, activeGoal }) => {
  const zones = useMemo(() => {
    // Derive target pace in seconds per mile
    let targetPacePerMile;
    if (activeGoal?.target_time_seconds && activeGoal?.distance_meters) {
      const targetPacePerKm = activeGoal.target_time_seconds / (activeGoal.distance_meters / 1000);
      targetPacePerMile = targetPacePerKm * 1.60934;
    } else if (currentPace) {
      targetPacePerMile = currentPace * 1.60934;
    } else {
      targetPacePerMile = 9 * 60; // 9:00/mi default
    }

    const formatPace = (secs) => {
      const m = Math.floor(secs / 60);
      const s = Math.round(secs % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Zone ranges relative to race pace
    // Z1: +90s to +60s, Z2: +60s to +20s, Z3: +20s to -10s (around race pace), Z4: -10s to -40s
    return ZONES.map((z, i) => {
      let low, high, hrLow, hrHigh;
      switch (i) {
        case 0: // Z1 Recovery
          low = targetPacePerMile + 60;
          high = targetPacePerMile + 90;
          hrLow = 120; hrHigh = 140;
          break;
        case 1: // Z2 Aerobic
          low = targetPacePerMile + 20;
          high = targetPacePerMile + 60;
          hrLow = 140; hrHigh = 155;
          break;
        case 2: // Z3 Threshold
          low = targetPacePerMile - 10;
          high = targetPacePerMile + 20;
          hrLow = 155; hrHigh = 170;
          break;
        case 3: // Z4 VO2 Max
          low = targetPacePerMile - 40;
          high = targetPacePerMile - 10;
          hrLow = 170; hrHigh = 185;
          break;
        default:
          low = 0; high = 0; hrLow = 0; hrHigh = 0;
      }
      return {
        ...z,
        paceRange: `${formatPace(Math.max(0, high))} - ${formatPace(Math.max(0, low))}`,
        hrRange: `${hrLow} - ${hrHigh}`,
      };
    });
  }, [currentPace, activeGoal]);

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Physiology Zones
      </h3>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-elevated">
              <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Zone</th>
              <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Type</th>
              <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Pace Range</th>
              <th className="text-right px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">HR (BPM)</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.zone} className={`border-t border-border-light ${z.highlight ? 'bg-navy/5' : ''}`}>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: z.color }}
                  >
                    {z.zone}
                  </span>
                </td>
                <td className={`px-4 py-2.5 font-medium ${z.highlight ? 'text-navy font-semibold' : 'text-text-primary'}`}>
                  {z.type}
                </td>
                <td className="px-4 py-2.5 font-mono text-text-primary">
                  {z.paceRange}<span className="text-text-muted">/mi</span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-text-secondary">
                  {z.hrRange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-text-muted mt-3">
        Zones estimated from target race pace. HR ranges are approximate.
      </p>
    </div>
  );
};

export default PhysiologyZones;
