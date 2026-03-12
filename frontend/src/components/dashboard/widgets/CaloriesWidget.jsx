import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", gray600: "#4A5173",
  white: "#FFFFFF", green: "#2ECC8B", amber: "#F5A623",
};

export default function CaloriesWidget({ data }) {
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
        }}>Calories Burned</div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 0', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            color: C.gray400,
          }}>No calorie data yet</div>
        </div>
      </div>
    );
  }

  const pct = Math.min(
    100,
    Math.round(
      ((data.weekly_burn || 0) / (data.weekly_target || 2000)) * 100
    )
  );

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        marginBottom: 12, fontFamily: 'DM Sans, sans-serif',
        fontSize: 10, fontWeight: 700, color: C.gray400,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>Calories Burned</div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', marginBottom: 8,
      }}>
        <div>
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 34,
            fontWeight: 700, color: C.navy, lineHeight: 1,
          }}>{(data.weekly_burn || 0).toLocaleString()}</span>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 13,
            color: C.gray400,
          }}> / {(data.weekly_target || 0).toLocaleString()} kcal</span>
        </div>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 14,
          fontWeight: 700, color: pct >= 80 ? C.green : C.amber,
        }}>{pct}%</span>
      </div>
      <div style={{
        height: 7, background: C.gray100, borderRadius: 99,
        overflow: 'hidden', marginBottom: 14,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg,${C.amber},${C.coral})`,
          borderRadius: 99,
        }} />
      </div>
      {data.per_run_avg > 0 && (
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 11,
          color: C.gray400, marginBottom: 10,
        }}>~{Math.round(data.per_run_avg)} kcal per run</div>
      )}
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data.trend || []} barSize={14}>
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
            formatter={(v) => [`${v} kcal`, 'Burned']}
          />
          <Bar dataKey="kcal" radius={[3, 3, 0, 0]}>
            {(data.trend || []).map((_, i) => (
              <Cell
                key={i}
                fill={
                  i === (data.trend?.length || 0) - 1 ? C.amber : C.navy
                }
                fillOpacity={
                  i === (data.trend?.length || 0) - 1 ? 1 : 0.5
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
