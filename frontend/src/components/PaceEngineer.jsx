import { useState, useMemo } from 'react';

const PaceEngineer = ({ activeGoal }) => {
  const defaultSeconds = activeGoal?.target_time_seconds || 0;
  const [targetHours, setTargetHours] = useState(Math.floor(defaultSeconds / 3600) || '');
  const [targetMinutes, setTargetMinutes] = useState(Math.floor((defaultSeconds % 3600) / 60) || '');

  const raceDistanceMiles = activeGoal
    ? (activeGoal.distance_meters || 42195) * 0.000621371
    : 26.2;

  const splits = useMemo(() => {
    const totalSeconds = (parseInt(targetHours) || 0) * 3600 + (parseInt(targetMinutes) || 0) * 60;
    if (totalSeconds <= 0) return null;

    const paceSecondsPerMile = totalSeconds / raceDistanceMiles;
    const paceMin = Math.floor(paceSecondsPerMile / 60);
    const paceSec = Math.floor(paceSecondsPerMile % 60);

    const formatTime = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
    };

    const checkpoints = [
      { label: '5K', miles: 3.10686 },
      { label: '13.1 mi', miles: 13.1 },
      { label: '20 mi', miles: 20 },
      { label: 'Finish', miles: raceDistanceMiles },
    ].filter(cp => cp.miles <= raceDistanceMiles + 0.1);

    return {
      paceDisplay: `${paceMin}:${paceSec.toString().padStart(2, '0')}`,
      checkpoints: checkpoints.map(cp => ({
        ...cp,
        time: formatTime(cp.miles * paceSecondsPerMile),
      })),
    };
  }, [targetHours, targetMinutes, raceDistanceMiles]);

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Pace Engineer
      </h3>

      <div className="flex items-end gap-3 mb-5">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">HR</label>
          <input
            type="number"
            min="0"
            max="12"
            value={targetHours}
            onChange={(e) => setTargetHours(e.target.value)}
            className="w-16 h-10 text-center text-lg font-bold border border-border rounded-lg bg-bg-elevated font-mono focus:outline-none focus:border-navy"
          />
        </div>
        <span className="text-xl font-bold text-text-muted pb-1">:</span>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">MIN</label>
          <input
            type="number"
            min="0"
            max="59"
            value={targetMinutes}
            onChange={(e) => setTargetMinutes(e.target.value)}
            className="w-16 h-10 text-center text-lg font-bold border border-border rounded-lg bg-bg-elevated font-mono focus:outline-none focus:border-navy"
          />
        </div>

        {splits && (
          <div className="ml-4 pl-4 border-l border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Req. Pace</div>
            <div className="text-2xl font-bold text-navy font-mono">{splits.paceDisplay}<span className="text-sm font-normal text-text-muted">/mi</span></div>
          </div>
        )}
      </div>

      {splits && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-elevated">
                <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Split</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {splits.checkpoints.map((cp, i) => (
                <tr key={cp.label} className={`border-t border-border-light ${i === splits.checkpoints.length - 1 ? 'bg-navy/5 font-semibold' : ''}`}>
                  <td className="px-4 py-2.5 text-text-primary">{cp.label}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-text-primary">{cp.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!splits && (
        <div className="text-sm text-text-muted text-center py-6">
          Enter your target finish time above
        </div>
      )}
    </div>
  );
};

export default PaceEngineer;
