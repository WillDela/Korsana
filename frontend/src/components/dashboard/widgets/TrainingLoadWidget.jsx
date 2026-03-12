import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray200: "#D4D8E8", gray400: "#8B93B0",
  gray600: "#4A5173", white: "#FFFFFF", green: "#2ECC8B",
  amber: "#F5A623", red: "#E84A4A",
};

export default function TrainingLoadWidget({ data }) {
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
          }}>Training Load</span>
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
          }}>Sync activities to see training load</div>
        </div>
      </div>
    );
  }

  const tsbColor = data.tsb > 10
    ? C.green
    : data.tsb >= -10
      ? C.navy
      : data.tsb >= -30 ? C.amber : C.red;

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 10,
          fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>Training Load</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 2fr',
        gap: 20, alignItems: 'center', marginBottom: 16,
      }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 48,
            fontWeight: 700, color: tsbColor, lineHeight: 1,
          }}>
            {data.tsb > 0 ? '+' : ''}{Math.round(data.tsb)}
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11,
            fontWeight: 600, color: C.navy, marginTop: 4,
          }}>{data.form_label}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10,
            color: C.gray400, marginTop: 2,
          }}>Form (TSB)</div>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 32,
              fontWeight: 700, color: C.coral, lineHeight: 1,
            }}>{Math.round(data.atl)}</div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 10,
              color: C.gray400,
            }}>Fatigue (ATL)</div>
          </div>
          <div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 32,
              fontWeight: 700, color: C.navy, lineHeight: 1,
            }}>{Math.round(data.ctl)}</div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 10,
              color: C.gray400,
            }}>Fitness (CTL)</div>
          </div>
          <div style={{
            display: 'inline-block',
            background: data.load_ratio > 1.3 ? '#FDE8E3' : '#E8F4EC',
            borderRadius: 99, padding: '2px 8px',
          }}>
            <span style={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
              fontWeight: 700,
              color: data.load_ratio > 1.3 ? C.coral : C.green,
            }}>
              {data.load_ratio?.toFixed(2)} ratio
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={data.history || []}>
            <defs>
              <linearGradient id="atlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.coral} stopOpacity={0.15} />
                <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ctlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.navy} stopOpacity={0.1} />
                <stop offset="100%" stopColor={C.navy} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip contentStyle={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
              background: C.navy, border: 'none', borderRadius: 8,
              color: '#fff',
            }} />
            <Area
              type="monotone" dataKey="atl" stroke={C.coral}
              strokeWidth={1.5} strokeDasharray="4 2"
              fill="url(#atlGrad)" dot={false} name="Fatigue"
            />
            <Area
              type="monotone" dataKey="ctl" stroke={C.navy}
              strokeWidth={2} fill="url(#ctlGrad)" dot={false}
              name="Fitness"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
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
          marginTop: 10, padding: '12px 14px', background: C.gray50,
          borderRadius: 10, fontFamily: 'DM Sans, sans-serif',
          fontSize: 11, color: C.gray600, lineHeight: 1.6,
        }}>
          <strong>ATL</strong> (Acute Training Load) = 7-day avg fatigue.{' '}
          <strong>CTL</strong> (Chronic Training Load) = 42-day fitness base.
          <strong> TSB</strong> = CTL - ATL. Positive = fresh, negative = tired.
          Optimal racing: TSB between -10 and +10.
        </div>
      )}
    </div>
  );
}
