const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
  red: "#E84A4A",
};

export default function RecoveryWidget({ data }) {
  if (!data) {
    return (
      <div style={{
        background: C.white, borderRadius: 16, padding: '20px 22px',
        boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10,
            fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>Recovery</span>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 9,
            fontWeight: 700, color: C.coral,
          }}>✦ Korsana</span>
        </div>
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

  const score = Math.round(data.recovery_pct || 0);
  const color = score >= 70 ? C.green : score >= 40 ? C.amber : C.red;
  const r = 48, circ = 2 * Math.PI * r;

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 10,
          fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>Recovery Status</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{
          position: 'relative', width: 120, height: 120, flexShrink: 0,
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r={r} fill="none"
              stroke={C.gray100} strokeWidth="10"
            />
            <circle
              cx="60" cy="60" r={r} fill="none"
              stroke={color} strokeWidth="10"
              strokeDasharray={`${(score / 100) * circ} ${circ}`}
              strokeLinecap="round" transform="rotate(-90 60 60)"
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 28,
              fontWeight: 700, color: C.navy, lineHeight: 1,
            }}>{score}</span>
            <span style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 10,
              color: C.gray400,
            }}>/ 100</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {data.last_hard_date && (
            <div style={{ marginBottom: 10 }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                color: C.gray400,
              }}>Last hard session</div>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 13,
                fontWeight: 700, color: C.navy, marginTop: 2,
              }}>{data.last_hard_date}</div>
              {data.last_hard_hr > 0 && (
                <div style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                  color: C.gray600,
                }}>
                  {data.last_hard_hr} bpm avg · {Math.round(data.hours_since)}h ago
                </div>
              )}
            </div>
          )}
          <div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 10,
              color: C.gray400,
            }}>Next quality session</div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 16,
              fontWeight: 700, color, marginTop: 2,
            }}>{data.next_quality_day}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
