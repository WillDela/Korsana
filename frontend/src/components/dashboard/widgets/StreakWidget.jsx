export default function StreakWidget({ data }) {
  if (!data) {
    return (
      <div className="widget-card">
        <div className="mb-[14px] font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Streak & Consistency
        </div>
        <div className="flex flex-col items-center py-6 gap-2">
          <span style={{ fontSize: 28 }}>📭</span>
          <div className="font-sans text-[12px] text-[var(--color-text-muted)]">No activity data yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card">
      <div className="mb-[14px] font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
        Streak & Consistency
      </div>
      <div className="flex justify-around mb-4 pb-[14px] border-b border-[var(--color-border-light)]">
        <div className="text-center">
          <div className="font-mono text-[36px] font-bold text-coral leading-none">{data.current_streak}</div>
          <div className="font-sans text-[11px] text-[var(--color-text-muted)] mt-1">week streak</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[36px] font-bold text-navy leading-none">{data.longest_streak}</div>
          <div className="font-sans text-[10px] text-[var(--color-text-muted)] mt-[3px]">longest</div>
        </div>
      </div>
      <div className="flex gap-1">
        {(data.weeks || []).map((w, i) => {
          const hit = w.hit || w.runs >= (data.weekly_target || 3);
          const latest = i === (data.weeks?.length || 0) - 1;
          return (
            <div key={i} className="flex-1 text-center">
              <div
                className="h-7 rounded-[5px] flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: hit
                    ? (latest ? '#2ECC8B' : '#C8F5E3')
                    : (latest ? '#E84A4A' : '#FDDEDE'),
                  border: latest
                    ? `2px solid ${hit ? '#2ECC8B' : '#E84A4A'}` : 'none',
                  color: hit
                    ? (latest ? '#fff' : '#1A7A50')
                    : (latest ? '#fff' : '#C0391B'),
                }}
              >
                {hit ? '✓' : '✗'}
              </div>
              <div className="font-mono text-[8px] text-[var(--color-text-muted)] mt-[3px]">{w.week}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 font-sans text-[10px] text-[var(--color-text-muted)] text-center">
        Target {data.weekly_target || 3} runs/wk
      </div>
    </div>
  );
}
