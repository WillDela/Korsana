const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
  red: "#E84A4A",
};

export default function StreakWidget({ data }) {
  if (!data) {
    return (
      <div style={{
        background: C.white, borderRadius: 16, padding: '20px 22px',
        boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
      }}>
        <div style={{
          marginBottom: 14, fontFamily: 'DM Sans, sans-serif',
          fontSize: 10, fontWeight: 700, color: C.gray400,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>Streak & Consistency</div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 0', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            color: C.gray400,
          }}>No activity data yet</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        marginBottom: 14, fontFamily: 'DM Sans, sans-serif',
        fontSize: 10, fontWeight: 700, color: C.gray400,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>Streak & Consistency</div>
      <div style={{
        display: 'flex', justifyContent: 'space-around',
        marginBottom: 16, paddingBottom: 14,
        borderBottom: `1px solid ${C.gray100}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 36,
            fontWeight: 700, color: C.coral, lineHeight: 1,
          }}>{data.current_streak}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11,
            color: C.gray400, marginTop: 4,
          }}>week streak</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 36,
            fontWeight: 700, color: C.navy, lineHeight: 1,
          }}>{data.longest_streak}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10,
            color: C.gray400, marginTop: 3,
          }}>longest</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {(data.weeks || []).map((w, i) => {
          const hit = w.hit || w.runs >= (data.weekly_target || 3);
          const latest = i === (data.weeks?.length || 0) - 1;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 28, borderRadius: 5,
                background: hit
                  ? (latest ? C.green : '#C8F5E3')
                  : (latest ? C.red : '#FDDEDE'),
                border: latest
                  ? `2px solid ${hit ? C.green : C.red}` : 'none',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700,
                color: hit
                  ? (latest ? C.white : '#1A7A50')
                  : (latest ? C.white : '#C0391B'),
              }}>
                {hit ? '✓' : '✗'}
              </div>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 8,
                color: C.gray400, marginTop: 3,
              }}>{w.week}</div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 10,
        color: C.gray400, textAlign: 'center',
      }}>
        Target {data.weekly_target || 3} runs/wk
      </div>
    </div>
  );
}
