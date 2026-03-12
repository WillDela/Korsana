import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
  blue: "#4A6CF7",
};

export default function ElevationWidget({ data }) {
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
        }}>Elevation</div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 0', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            color: C.gray400,
          }}>No elevation data yet</div>
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
      }}>Elevation</div>
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 26,
            fontWeight: 700, color: C.navy, lineHeight: 1,
          }}>
            {(data.weekly_gain_ft || 0).toLocaleString()}
          </span>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 13,
            color: C.gray400,
          }}>ft gain</span>
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 11,
          color: C.gray400, marginTop: 3,
        }}>
          ↓ {(data.weekly_loss_ft || 0).toLocaleString()} ft loss
        </div>
        {data.last_run_gain_ft > 0 && (
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11,
            color: C.gray600, marginTop: 3,
          }}>Last run: +{data.last_run_gain_ft} ft</div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <AreaChart data={data.trend || []}>
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.blue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 8,
              fill: C.gray400,
            }}
            axisLine={false} tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
              background: C.navy, border: 'none', borderRadius: 8,
              color: '#fff',
            }}
            formatter={(v) => [`${v} ft`, 'Gain']}
          />
          <Area
            type="monotone" dataKey="ft" stroke={C.blue}
            strokeWidth={2} fill="url(#elevGrad)" dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
