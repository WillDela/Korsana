import {
  LineChart, Line, XAxis, YAxis,
  ReferenceLine, Tooltip, ResponsiveContainer,
} from 'recharts';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
};

export default function CadenceWidget({ data }) {
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
        }}>Cadence</div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 0', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            color: C.gray400,
          }}>No cadence data yet</div>
        </div>
      </div>
    );
  }

  const gap = (data.goal_spm || 180) - (data.avg_spm || 0);

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        marginBottom: 10, fontFamily: 'DM Sans, sans-serif',
        fontSize: 10, fontWeight: 700, color: C.gray400,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>Cadence</div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 4,
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 34,
          fontWeight: 700, color: C.navy, lineHeight: 1,
        }}>{data.avg_spm || '--'}</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 13,
          color: C.gray400,
        }}>spm avg</span>
      </div>
      <div style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: 11,
        color: gap > 5 ? C.amber : C.green, marginBottom: 12,
      }}>
        Goal: {data.goal_spm || 180} spm ·{' '}
        {gap > 0 ? `${gap} away` : 'On target ✓'}
      </div>
      {data.by_activity?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {data.by_activity.map((a, i) => (
            <div key={i} style={{
              flex: 1, background: C.gray50, borderRadius: 8,
              padding: '7px 4px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 13,
                fontWeight: 700, color: C.navy,
              }}>{a.spm}</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 9,
                color: C.gray400, marginTop: 1,
              }}>{a.type}</div>
            </div>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={data.trend || []}>
          <XAxis
            dataKey="week"
            tick={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 8,
              fill: C.gray400,
            }}
            axisLine={false} tickLine={false}
          />
          <YAxis domain={[160, 190]} hide />
          <ReferenceLine
            y={data.goal_spm || 180} stroke={C.coral}
            strokeDasharray="4 3" strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
              background: C.navy, border: 'none', borderRadius: 8,
              color: '#fff',
            }}
            formatter={(v) => [`${v} spm`, 'Cadence']}
          />
          <Line
            type="monotone" dataKey="spm" stroke={C.green}
            strokeWidth={2.5} dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
