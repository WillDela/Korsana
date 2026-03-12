const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
  red: "#E84A4A", blue: "#4A6CF7",
};

const ZONE_COLORS = ['#5CC8FF', C.green, C.amber, C.coral, C.red];

export default function HRZonesWidget({ data }) {
  if (!data || !data.zones?.length) {
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
          }}>HR Zones · This Week</span>
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
          }}>No HR data this week</div>
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
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 10,
          fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>HR Zones · This Week</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      {data.zones.map((z, i) => (
        <div key={i} style={{
          marginBottom: i < data.zones.length - 1 ? 11 : 0,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 4,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: ZONE_COLORS[i],
              }} />
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                fontWeight: 600, color: C.gray600,
              }}>{z.name}</span>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                color: C.gray400,
              }}>{z.bpm}</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                fontWeight: 700, color: C.navy,
              }}>{Math.round(z.minutes)}min</span>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                color: C.gray400,
              }}>{Math.round(z.pct)}%</span>
              {z.in_range && (
                <span style={{ color: C.green, fontSize: 12 }}>✓</span>
              )}
            </div>
          </div>
          <div style={{
            height: 6, background: C.gray100, borderRadius: 99,
          }}>
            <div style={{
              width: `${z.pct}%`, height: '100%',
              background: ZONE_COLORS[i], borderRadius: 99,
            }} />
          </div>
        </div>
      ))}
      {data.z1z2_combined !== undefined && (
        <div style={{
          marginTop: 12, padding: '8px 10px',
          background: data.z1z2_combined >= 80 ? '#E8F4EC' : '#FFF3CD',
          borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
          fontSize: 11,
          color: data.z1z2_combined >= 80 ? C.green : C.amber,
        }}>
          Z1+Z2: {Math.round(data.z1z2_combined)}%{' '}
          {data.z1z2_combined >= 80
            ? '✓ Great aerobic base'
            : '— Aim for >=80% easy running'}
        </div>
      )}
    </div>
  );
}
