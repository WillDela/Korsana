const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
};

export default function ExecutionScoreWidget({ data }) {
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
          }}>Execution Score</span>
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
          }}>Complete planned workouts to see scores</div>
        </div>
      </div>
    );
  }

  const avg = Math.round(data.weekly_avg || 0);
  const avgColor = avg >= 80
    ? C.green
    : avg >= 60 ? C.amber : C.coral;
  const avgLabel = avg >= 80
    ? 'Excellent'
    : avg >= 60 ? 'Good' : 'Needs work';

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
        }}>Execution Score</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10,
        marginBottom: 16,
      }}>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 36,
          fontWeight: 700, color: avgColor, lineHeight: 1,
        }}>{avg}</span>
        <div style={{ marginBottom: 4 }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11,
            fontWeight: 600, color: avgColor,
          }}>{avgLabel}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10,
            color: C.gray400,
          }}>avg last 30 days</div>
        </div>
      </div>
      {(data.runs || []).length > 0 ? (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 50px 1fr',
            gap: 6, padding: '4px 6px', marginBottom: 4,
          }}>
            {['Date', 'Type', 'Score', 'Note'].map(h => (
              <div key={h} style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 9,
                fontWeight: 700, color: C.gray400,
                textTransform: 'uppercase',
              }}>{h}</div>
            ))}
          </div>
          {data.runs.map((r, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 50px 1fr',
              gap: 6, padding: '7px 6px', borderRadius: 7,
              background: i % 2 === 0 ? C.gray50 : C.white,
              alignItems: 'center',
            }}>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                color: C.gray600,
              }}>
                {r.date
                  ? new Date(r.date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })
                  : '--'}
              </span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                color: C.navy,
              }}>{r.type}</span>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 12,
                fontWeight: 700,
                color: r.score >= 80
                  ? C.green
                  : r.score >= 60 ? C.amber : C.coral,
              }}>{Math.round(r.score)}</span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                color: C.gray400,
              }}>{r.issue || '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 12,
          color: C.gray400, textAlign: 'center', padding: '10px 0',
        }}>No completed planned runs yet</div>
      )}
    </div>
  );
}
