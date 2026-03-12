const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
  red: "#E84A4A",
};

export default function LongRunConfidenceWidget({ data }) {
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
          }}>Long Run</span>
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
          }}>No long runs recorded yet</div>
        </div>
      </div>
    );
  }

  const pct = data.coverage_pct || 0;
  const color = pct >= 90 ? C.green : pct >= 60 ? C.amber : C.coral;

  const r = 56;
  const cx = 80, cy = 75;
  const startAngle = -180;
  const endAngle = startAngle + (pct / 100) * 180;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = (angle) => cx + r * Math.cos(toRad(angle));
  const arcY = (angle) => cy + r * Math.sin(toRad(angle));
  const largeArc = pct > 50 ? 1 : 0;

  const confidenceBadgeColor = data.confidence === 'Strong'
    ? C.green
    : data.confidence === 'Building' ? C.amber : C.coral;

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 10,
          fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>Long Run Coverage</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <svg width="160" height="90" viewBox="0 0 160 90">
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="#ECEEF4" strokeWidth="12"
            strokeLinecap="round"
          />
          {pct > 0 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${arcX(endAngle)} ${arcY(endAngle)}`}
              fill="none" stroke={color} strokeWidth="12"
              strokeLinecap="round"
            />
          )}
          {[50, 75, 90].map(m => {
            const angle = -180 + (m / 100) * 180;
            const mx = cx + (r + 16) * Math.cos(toRad(angle));
            const my = cy + (r + 16) * Math.sin(toRad(angle));
            return (
              <text
                key={m} x={mx} y={my} textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="IBM Plex Mono, monospace" fontSize="8"
                fill="#8B93B0"
              >{m}%</text>
            );
          })}
        </svg>
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 48,
          fontWeight: 700, color, lineHeight: 1, marginTop: -4,
        }}>
          {Math.round(pct)}%
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 11,
          color: C.gray400, marginTop: 4,
        }}>of race distance covered</div>
        <div style={{
          display: 'flex', gap: 12, marginTop: 14,
          alignItems: 'center',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11,
            color: C.gray600,
          }}>
            {data.long_run_count} long run
            {data.long_run_count !== 1 ? 's' : ''} (84 days)
          </div>
          <span style={{
            background: `${confidenceBadgeColor}20`,
            color: confidenceBadgeColor,
            fontFamily: 'DM Sans, sans-serif', fontSize: 9,
            fontWeight: 700, borderRadius: 99, padding: '2px 8px',
          }}>{data.confidence}</span>
        </div>
      </div>
    </div>
  );
}
