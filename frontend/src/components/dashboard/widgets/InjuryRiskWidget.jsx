import { useState } from 'react';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
  red: "#E84A4A",
};

export default function InjuryRiskWidget({ data }) {
  const [expanded, setExpanded] = useState(false);

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
          }}>Injury Risk</span>
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
          }}>No data to assess risk</div>
        </div>
      </div>
    );
  }

  const riskColor = data.risk_level === 'High'
    ? C.red
    : data.risk_level === 'Moderate' ? C.amber : C.green;

  const factors = [
    { label: 'Mileage Jump', score: data.mileage_jump_score },
    { label: 'Load Ratio', score: data.load_ratio_score },
    { label: 'Consec. Hard Days', score: data.consecutive_score },
  ];

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
        }}>Injury Risk</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 36,
            fontWeight: 700, color: riskColor, lineHeight: 1,
          }}>{data.score}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11,
            fontWeight: 600, color: riskColor, marginTop: 3,
          }}>{data.risk_level} Risk</div>
        </div>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {factors.map((f, i) => (
            <div key={i}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: 3,
              }}>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                  color: C.gray600,
                }}>{f.label}</span>
                <span style={{
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                  color: C.navy,
                }}>{Math.round(f.score)}</span>
              </div>
              <div style={{
                height: 5, background: C.gray100, borderRadius: 99,
              }}>
                <div style={{
                  width: `${f.score}%`, height: '100%',
                  background: f.score > 70
                    ? C.red
                    : f.score > 40 ? C.amber : C.green,
                  borderRadius: 99,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {data.primary_signal && (
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 11,
          color: C.gray600, padding: '8px 10px', background: C.gray50,
          borderRadius: 8, marginBottom: 8,
        }}>
          {data.primary_signal}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none',
          fontFamily: 'DM Sans, sans-serif', fontSize: 11,
          color: C.gray400, cursor: 'pointer', padding: 0,
        }}
      >
        How this works {expanded ? '▴' : '▾'}
      </button>
      {expanded && (
        <div style={{
          marginTop: 8, padding: '10px 12px', background: C.gray50,
          borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
          fontSize: 11, color: C.gray600, lineHeight: 1.6,
        }}>
          Score = 40% mileage jump + 40% ATL/CTL ratio + 20% consecutive
          hard days. 0-39: Low, 40-69: Moderate, 70+: High risk.
        </div>
      )}
    </div>
  );
}
