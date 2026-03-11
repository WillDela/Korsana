import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';
import { activitiesAPI } from '../api/activities';
import { calendarAPI } from '../api/calendar';
import { getErrorMessage } from '../api/client';
import SessionDetailsModal from '../components/SessionDetailsModal';

// ─── Design tokens ────────────────────────────────────────────
const C = {
  navy: "#1B2559", navyLight: "#2A3A7C", coral: "#E8634A",
  bg: "#F5F6FA", white: "#FFFFFF", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray200: "#D4D8E8", gray400: "#8B93B0",
  gray600: "#4A5173", green: "#2ECC8B", amber: "#F5A623",
  red: "#E84A4A", blue: "#4A6CF7", purple: "#8B5CF6",
};

const WC = {
  Easy: { bg: "#E8F0FE", text: "#2A3A7C" },
  "Long Run": { bg: C.navy, text: "#FFFFFF" },
  Long: { bg: C.navy, text: "#FFFFFF" },
  Tempo: { bg: "#FDE8E3", text: "#C0391B" },
  Intervals: { bg: "#FFF3CD", text: "#856404" },
  Rest: { bg: C.gray100, text: C.gray400 },
  "Cross Train": { bg: "#F0FDE8", text: "#2A5A1B" },
  Recovery: { bg: "#F0FDE8", text: "#2A5A1B" },
};

const PC = {
  Build: { accent: C.blue, label: "#2A3A7C", badge: "#E8F0FE" },
  Peak: { accent: C.coral, label: "#C0391B", badge: "#FDE8E3" },
  Taper: { accent: C.green, label: "#1A7A50", badge: "#E9FBF3" },
  "Race Week": { accent: C.amber, label: "#856404", badge: "#FFF3CD" },
};

const WIDGETS = [
  { id: 'hrzones', label: 'HR Zones', icon: '❤' },
  { id: 'volume', label: 'Volume', icon: '🥧' },
  { id: 'elevation', label: 'Elevation', icon: '⛰' },
  { id: 'cadence', label: 'Cadence', icon: '👟' },
  { id: 'calories', label: 'Calories', icon: '🔥' },
  { id: 'consistency', label: 'Streak', icon: '🔥' },
  { id: 'monthly', label: 'Monthly', icon: '📅' },
  { id: 'prs', label: 'PRs', icon: '🏆' },
  { id: 'vo2max', label: 'VO₂ Max', icon: '📈' },
  { id: 'splits', label: 'Paces', icon: '📊' },
  { id: 'power', label: 'Power', icon: '⚡' },
  { id: 'shoes', label: 'Shoes', icon: '👟' },
];

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// ─── Helpers ──────────────────────────────────────────────────
const fmtDateISO = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const fmtPace = (secPerKm) => {
  if (!secPerKm) return '--:--';
  const spm = secPerKm * 1.60934;
  return `${Math.floor(spm / 60)}:${String(Math.floor(spm % 60)).padStart(2, '0')}`;
};

const fmtTime = (secs) => {
  if (!secs) return '--:--:--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const fmtTargetTime = (secs) => {
  if (!secs) return '--:--:--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getTrainingPhase = (weeksOut) => {
  if (weeksOut < 2) return 'Race Week';
  if (weeksOut < 8) return 'Taper';
  if (weeksOut < 12) return 'Peak';
  return 'Build';
};

const getWorkoutSegments = (type, miles) => {
  const m = miles || 0;
  switch (type) {
    case 'Long Run':
    case 'Long':
      return [
        { name: 'Warm-up', detail: '2 mi easy · HR ramp to Z2' },
        { name: 'Main Set', detail: `${Math.max(1, m - 4)} mi @ Z2 · feel conversational` },
        { name: 'Cool-down', detail: '2 mi easy walk/jog' },
      ];
    case 'Tempo':
      return [
        { name: 'Warm-up', detail: '1 mi easy' },
        { name: 'Main Set', detail: `${Math.max(1, m - 2)} mi @ Z3–Z4 · comfortably hard` },
        { name: 'Cool-down', detail: '1 mi easy' },
      ];
    case 'Intervals':
      return [
        { name: 'Warm-up', detail: '1 mi easy + strides' },
        { name: 'Main Set', detail: 'Repeats @ Z4–Z5 · full recovery' },
        { name: 'Cool-down', detail: '1 mi easy jog' },
      ];
    default:
      return [
        { name: 'Effort', detail: 'Z1–Z2 · conversational pace' },
        { name: 'Duration', detail: `${m > 0 ? `${m} mi target` : 'Easy effort'}` },
        { name: 'Focus', detail: 'Keep HR below Z3' },
      ];
  }
};

// ─── Atom components ──────────────────────────────────────────
const Pill = ({ type, sm = false }) => {
  const s = WC[type] || WC.Easy;
  return (
    <span style={{
      background: s.bg, color: s.text,
      borderRadius: 5,
      padding: sm ? "2px 7px" : "3px 9px",
      fontSize: sm ? 9 : 11,
      fontFamily: "DM Sans, sans-serif",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      whiteSpace: "nowrap",
    }}>{type}</span>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.white,
    borderRadius: 16,
    padding: "20px 22px",
    boxShadow: "0 1px 2px rgba(27,37,89,0.05), 0 2px 12px rgba(27,37,89,0.04)",
    ...style
  }}>{children}</div>
);

const SLabel = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.1em" }}>
      {children}
    </div>
    {action}
  </div>
);

const Tip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.navy, borderRadius: 10, padding: "8px 12px" }}>
      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 700, color: "#fff" }}>
        {payload[0]?.value}{unit}
      </div>
    </div>
  );
};

const Gauge = ({ score }) => {
  const color = score >= 70 ? C.green : score >= 40 ? C.amber : C.red;
  const r = 48, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={C.gray100} strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 60 60)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: C.gray400 }}>/ 100</span>
      </div>
    </div>
  );
};

// ─── SyncDropdown ─────────────────────────────────────────────
const SOURCES = [
  { id: 'strava', label: 'Strava', status: 'connected', color: '#FC4C02', icon: 'S' },
  { id: 'garmin', label: 'Garmin', status: 'coming', color: C.blue, icon: 'G' },
  { id: 'coros', label: 'Coros', status: 'coming', color: C.navy, icon: 'C' },
];

const SyncDropdown = ({ isSyncing, onSync }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: open ? C.gray100 : C.gray50,
          border: `1px solid ${C.gray200}`, borderRadius: 8,
          padding: '5px 12px', fontFamily: 'DM Sans, sans-serif',
          fontSize: 11, fontWeight: 700, color: C.navy, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={isSyncing ? C.coral : C.navy} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: isSyncing ? 'krs-spin 0.8s linear infinite' : 'none' }}>
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
        </svg>
        {isSyncing ? 'Syncing…' : 'Sync'}
        <span style={{ fontSize: 11, color: C.gray400, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: C.white, borderRadius: 14, width: 210,
            boxShadow: '0 4px 32px rgba(27,37,89,0.16)', border: `1px solid ${C.gray100}`,
            padding: '12px', zIndex: 300,
          }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Data Sources</div>
            {SOURCES.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 9, marginBottom: 4,
                background: s.status === 'connected' ? C.gray50 : 'transparent',
                border: `1px solid ${s.status === 'connected' ? C.gray100 : 'transparent'}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: s.status === 'connected' ? s.color : '#E8EAF0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 700,
                  color: s.status === 'connected' ? C.white : C.gray400, flexShrink: 0,
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: s.status === 'connected' ? C.navy : C.gray400 }}>{s.label}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: s.status === 'connected' ? C.green : C.gray400, marginTop: 1 }}>
                    {s.status === 'connected' ? '● Connected' : 'Coming soon'}
                  </div>
                </div>
                {s.status === 'connected' && (
                  <button onClick={() => { onSync('strava'); setOpen(false); }} style={{
                    background: C.navy, border: 'none', borderRadius: 7,
                    padding: '5px 10px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 11, fontWeight: 700, color: C.white, cursor: 'pointer',
                  }}>Sync</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── WidgetSelector ───────────────────────────────────────────
const WidgetSelector = ({ active, toggle }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: open ? 'rgba(27,37,89,0.08)' : C.gray50,
          border: `1px solid ${open ? C.navy : C.gray200}`,
          borderRadius: 8, padding: '5px 12px',
          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700,
          color: C.navy, cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
        Strava live
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
          background: C.coral, color: C.white, borderRadius: 99, padding: '1px 6px',
        }}>{active.length}</span>
        <span style={{ fontSize: 11, color: C.gray400, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: C.white, borderRadius: 14, width: 320,
            boxShadow: '0 4px 32px rgba(27,37,89,0.16)', border: `1px solid ${C.gray100}`,
            padding: '14px 14px 10px', zIndex: 300,
          }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Choose what to show from Strava
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {WIDGETS.map(w => {
                const on = active.includes(w.id);
                return (
                  <button key={w.id} onClick={() => toggle(w.id)} style={{
                    background: on ? C.navy : C.gray50,
                    border: `1.5px solid ${on ? C.navy : C.gray100}`,
                    borderRadius: 9, padding: '8px 6px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 14 }}>{w.icon}</span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 700, color: on ? C.white : C.gray600 }}>{w.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.gray100}`, display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => WIDGETS.forEach(w => !active.includes(w.id) && toggle(w.id))}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: C.navy, background: 'none', border: 'none', cursor: 'pointer' }}>
                Show all
              </button>
              <button
                onClick={() => [...active].forEach(id => toggle(id))}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: C.gray400, background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Widget: Elevation ────────────────────────────────────────
const ElevWidget = ({ data }) => (
  <Card>
    <SLabel>Elevation This Week</SLabel>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 34, fontWeight: 700, color: C.navy, lineHeight: 1 }}>
        {data.weeklyGain.toLocaleString()}<span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.gray400, fontWeight: 400 }}> ft gain</span>
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray400, marginTop: 3 }}>↓ {data.weeklyLoss.toLocaleString()} ft loss</div>
    </div>
    <ResponsiveContainer width="100%" height={90}>
      <AreaChart data={data.trend}>
        <defs>
          <linearGradient id="krsEG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.blue} stopOpacity={0.25} />
            <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="week" tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: C.gray400 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip content={({ active, payload, label }) => <Tip active={active} payload={payload} label={label} unit=" ft" />} />
        <Area type="monotone" dataKey="ft" stroke={C.blue} strokeWidth={2} fill="url(#krsEG)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

// ─── Widget: Cadence ──────────────────────────────────────────
const CadWidget = ({ data }) => (
  <Card>
    <SLabel>Cadence</SLabel>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 34, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{data.avgSPM}</span>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.gray400 }}>spm avg</span>
    </div>
    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: C.amber, marginBottom: 12 }}>
      Goal: {data.goal} spm · {Math.max(0, data.goal - data.avgSPM)} away
    </div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {data.byActivity.map((a, i) => (
        <div key={i} style={{ flex: 1, background: C.gray50, borderRadius: 8, padding: '7px 4px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: C.navy }}>{a.spm}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: C.gray400, marginTop: 1 }}>{a.type}</div>
        </div>
      ))}
    </div>
    <ResponsiveContainer width="100%" height={70}>
      <LineChart data={data.trend}>
        <XAxis dataKey="week" tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: C.gray400 }} axisLine={false} tickLine={false} />
        <YAxis domain={[160, 190]} hide />
        <ReferenceLine y={data.goal} stroke={C.coral} strokeDasharray="4 3" strokeWidth={1.5} />
        <Line type="monotone" dataKey="spm" stroke={C.green} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </Card>
);

// ─── Widget: Calories ─────────────────────────────────────────
const CalWidget = ({ data }) => {
  const pct = Math.min(100, Math.round((data.weeklyBurn / data.weeklyTarget) * 100));
  return (
    <Card>
      <SLabel>Calories Burned</SLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 34, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{data.weeklyBurn.toLocaleString()}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.gray400 }}> / {data.weeklyTarget.toLocaleString()} kcal</span>
        </div>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, fontWeight: 700, color: pct >= 80 ? C.green : C.amber }}>{pct}%</span>
      </div>
      <div style={{ height: 7, background: C.gray100, borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${C.amber},${C.coral})`, borderRadius: 99 }} />
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data.trend} barSize={14}>
          <XAxis dataKey="week" tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: C.gray400 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={({ active, payload, label }) => <Tip active={active} payload={payload} label={label} unit=" kcal" />} />
          <Bar dataKey="kcal" radius={[3, 3, 0, 0]}>
            {data.trend.map((_, i) => (
              <Cell key={i} fill={i === data.trend.length - 1 ? C.amber : C.navy} fillOpacity={i === data.trend.length - 1 ? 1 : 0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─── Widget: HR Zones ─────────────────────────────────────────
const HRZWidget = ({ data }) => (
  <Card>
    <SLabel>HR Zones · This Week</SLabel>
    {data.map((z, i) => (
      <div key={i} style={{ marginBottom: i < data.length - 1 ? 12 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: C.gray600 }}>{z.zone}</span>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.gray400, marginLeft: 8 }}>{z.bpm}</span>
          </div>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: C.navy }}>{z.pct}%</span>
        </div>
        <div style={{ height: 7, background: C.gray100, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${z.pct}%`, height: '100%', background: z.color, borderRadius: 99 }} />
        </div>
      </div>
    ))}
  </Card>
);

// ─── Widget: Volume by Type ───────────────────────────────────
const VolumeWidget = ({ data }) => {
  const [hov, setHov] = useState(null);
  const total = data.reduce((s, x) => s + x.miles, 0);
  return (
    <Card>
      <SLabel>Volume by Type</SLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={data} dataKey="miles" cx="50%" cy="50%" innerRadius={28} outerRadius={46} strokeWidth={0}
                onMouseEnter={(_, i) => setHov(i)} onMouseLeave={() => setHov(null)}>
                {data.map((x, i) => <Cell key={i} fill={x.color} opacity={hov === null || hov === i ? 1 : 0.3} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: C.navy, lineHeight: 1 }}>
              {hov !== null ? data[hov].miles.toFixed(1) : total.toFixed(0)}
            </span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, color: C.gray400 }}>mi</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: hov === null || hov === i ? 1 : 0.4, transition: 'opacity 0.15s', cursor: 'default' }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: x.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: C.gray600, flex: 1 }}>{x.type}</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, color: C.navy }}>{x.miles.toFixed(1)}</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: C.gray400, minWidth: 28, textAlign: 'right' }}>
                {total > 0 ? Math.round((x.miles / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ─── Widget: Streak & Consistency ────────────────────────────
const ConsistWidget = ({ data }) => (
  <Card>
    <SLabel>Streak & Consistency</SLabel>
    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.gray100}` }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 40, fontWeight: 700, color: C.coral, lineHeight: 1 }}>{data.streak}</div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: C.gray400, marginTop: 4 }}>week streak</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 40, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{data.longestStreak}</div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: C.gray400, marginTop: 3 }}>longest</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 4 }}>
      {data.weeks.map((w, i) => {
        const hit = w.runs >= data.weeklyTarget;
        const latest = i === data.weeks.length - 1;
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: 28, borderRadius: 5,
              background: hit ? (latest ? C.green : '#C8F5E3') : (latest ? C.red : '#FDDEDE'),
              border: latest ? `2px solid ${hit ? C.green : C.red}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: hit ? (latest ? C.white : '#1A7A50') : (latest ? C.white : '#C0391B'),
            }}>{hit ? '✓' : '✗'}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: C.gray400, marginTop: 3 }}>{w.week}</div>
          </div>
        );
      })}
    </div>
    <div style={{ marginTop: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: C.gray400, textAlign: 'center' }}>
      Target {data.weeklyTarget} runs/wk
    </div>
  </Card>
);

// ─── Widget: Monthly Mileage ──────────────────────────────────
const MonthlyWidget = ({ data }) => {
  const pct = Math.min(100, Math.round((data.actual / data.target) * 100));
  return (
    <Card>
      <SLabel>{data.monthName} Mileage</SLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 34, fontWeight: 700, color: C.navy }}>{data.actual.toFixed(1)}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.gray400 }}> / {data.target} mi</span>
        </div>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, fontWeight: 700, color: pct >= 80 ? C.green : C.amber }}>{pct}%</span>
      </div>
      <div style={{ height: 7, background: C.gray100, borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${C.navy},${C.coral})`, borderRadius: 99 }} />
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data.byWeek} barGap={2} barSize={14}>
          <XAxis dataKey="week" tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, fill: C.gray400 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, Math.max(50, data.target / 4 + 10)]} />
          <Bar dataKey="planned" radius={[3, 3, 0, 0]} fill={C.gray100} />
          <Bar dataKey="actual" radius={[3, 3, 0, 0]} fill={C.navy} fillOpacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─── Widget: VO2 Max (placeholder) ───────────────────────────
const VO2Placeholder = () => (
  <Card>
    <SLabel>VO₂ Max</SLabel>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
      <span style={{ fontSize: 28 }}>📈</span>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray400, textAlign: 'center', lineHeight: 1.6 }}>
        VO₂ Max requires Garmin or<br />premium Strava data
      </div>
    </div>
  </Card>
);

// ─── Widget: Power (placeholder) ─────────────────────────────
const PowerPlaceholder = () => (
  <Card>
    <SLabel>Running Power</SLabel>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
      <span style={{ fontSize: 28 }}>⚡</span>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray400, textAlign: 'center', lineHeight: 1.6 }}>
        Power requires a running<br />power meter or Stryd
      </div>
    </div>
  </Card>
);

// ─── Widget: PRs ──────────────────────────────────────────────
const PRWidget = ({ data }) => {
  const hasPRs = data.some(d => d.pr);
  return (
    <Card>
      <SLabel>Personal Bests</SLabel>
      {!hasPRs ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
          <span style={{ fontSize: 28 }}>🏆</span>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray400, textAlign: 'center', lineHeight: 1.5 }}>
            Sync runs near race distances<br />to see your PRs here
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {data.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: i < data.length - 1 ? `1px solid ${C.gray100}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: d.pr ? `${C.navy}12` : C.gray50,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 700, color: d.pr ? C.navy : C.gray400 }}>{d.label}</span>
                </div>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: C.gray400 }}>
                  {d.pr ? new Date(d.pr.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              {d.pr ? (
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 18, fontWeight: 700, color: C.navy }}>
                  {fmtTime(d.pr.time)}
                </span>
              ) : (
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray200 }}>no data</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// ─── Widget: Shoes (placeholder) ─────────────────────────────
const ShoesPlaceholder = () => (
  <Card>
    <SLabel>Shoe Mileage</SLabel>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
      <span style={{ fontSize: 28 }}>👟</span>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray400, textAlign: 'center', lineHeight: 1.6 }}>
        Shoe tracking coming soon
      </div>
    </div>
  </Card>
);

// ─── Widget: Recent Paces ─────────────────────────────────────
const RecentPacesWidget = ({ data }) => {
  if (!data.length) {
    return (
      <Card>
        <SLabel>Recent Paces</SLabel>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
          <span style={{ fontSize: 28 }}>📊</span>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray400, textAlign: 'center' }}>
            No runs synced yet
          </div>
        </div>
      </Card>
    );
  }
  const avgPace = data.reduce((s, r) => s + r.pace, 0) / data.length;
  return (
    <Card>
      <SLabel>Recent Paces</SLabel>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{fmtPace(avgPace)}</span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.gray400 }}>avg /mi · last {data.length} runs</span>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={data} barSize={14}>
          <XAxis dataKey="date" tick={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: C.gray400 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={['dataMin * 0.97', 'dataMax * 1.03']} reversed />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: C.gray600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: C.navy }}>{fmtPace(payload[0].value)}/mi</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: C.gray400 }}>{payload[0].payload.miles} mi</div>
              </div>
            );
          }} />
          <Bar dataKey="pace" radius={[3, 3, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? C.coral : C.navy} fillOpacity={i === data.length - 1 ? 1 : 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─── WidgetGrid ───────────────────────────────────────────────
const WidgetGrid = ({ active, computedData }) => {
  if (!active.length) return null;
  const has = (id) => active.includes(id);
  // Full-width widgets span both columns
  const wide = { gridColumn: '1 / -1' };
  return (
    <div>
      <SLabel>{active.length} Strava Widget{active.length !== 1 ? 's' : ''} Active</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {has('hrzones') && <HRZWidget data={computedData.hrZones} />}
        {has('volume') && <VolumeWidget data={computedData.volumeByType} />}
        {has('elevation') && <ElevWidget data={computedData.elevation} />}
        {has('cadence') && <CadWidget data={computedData.cadence} />}
        {has('calories') && <CalWidget data={computedData.calories} />}
        {has('consistency') && <ConsistWidget data={computedData.consistency} />}
        {has('monthly') && <div style={wide}><MonthlyWidget data={computedData.monthly} /></div>}
        {has('prs') && <PRWidget data={computedData.prs} />}
        {has('vo2max') && <VO2Placeholder />}
        {has('splits') && <div style={wide}><RecentPacesWidget data={computedData.recentPaces} /></div>}
        {has('power') && <PowerPlaceholder />}
        {has('shoes') && <ShoesPlaceholder />}
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const [searchParams] = useSearchParams();

  // Core state
  const [activeGoal, setActiveGoal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [weekEntries, setWeekEntries] = useState([]);
  const [coachInsight, setCoachInsight] = useState('');

  // Loading/sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState({ text: '', type: '' });
  const [lastSynced, setLastSynced] = useState(null);

  // UI state
  const [showFactors, setShowFactors] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_widgets');
      return saved ? JSON.parse(saved) : ['hrzones', 'elevation', 'volume', 'consistency'];
    } catch { return ['hrzones', 'elevation', 'volume', 'consistency']; }
  });
  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(activeWidgets));
  }, [activeWidgets]);
  const toggleWidget = useCallback((id) => setActiveWidgets(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  ), []);

  // ─── Fetches ────────────────────────────────────────────────
  const fetchActiveGoal = useCallback(async () => {
    try {
      const res = await goalsAPI.getActiveGoal();
      setActiveGoal(res.goal);
    } catch { /* no active goal */ }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await activitiesAPI.getActivities();
      setActivities(res.activities || []);
    } catch { setActivities([]); }
  }, []);

  const fetchActivitiesAndAutoSync = useCallback(async () => {
    try {
      const res = await activitiesAPI.getActivities();
      if (!res.activities?.length) {
        try {
          await stravaAPI.syncActivities();
          const synced = await activitiesAPI.getActivities();
          setActivities(synced.activities || []);
          setLastSynced(new Date().toISOString());
        } catch { setActivities([]); }
      } else {
        setActivities(res.activities);
      }
    } catch { setActivities([]); }
  }, []);

  const fetchWeekEntries = useCallback(async () => {
    try {
      const today = new Date();
      // Monday of current week
      const monday = new Date(today);
      const day = today.getDay();
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(0, 0, 0, 0);
      const res = await calendarAPI.getWeek(fmtDateISO(monday));
      setWeekEntries(res.entries || []);
    } catch { setWeekEntries([]); }
  }, []);

  const handlePlanWorkout = () => setShowPlanModal(true);

  const handleSavePlan = useCallback(async (data) => {
    await calendarAPI.createEntry(data);
    fetchWeekEntries();
  }, [fetchWeekEntries]);

  const handleSyncActivities = useCallback(async (provider = 'strava') => {
    if (provider !== 'strava') {
      const name = provider[0].toUpperCase() + provider.slice(1);
      setSyncMsg({ text: `${name} coming soon!`, type: 'error' });
      setTimeout(() => setSyncMsg({ text: '', type: '' }), 3000);
      return;
    }
    try {
      setSyncMsg({ text: '', type: '' });
      setIsSyncing(true);
      const result = await stravaAPI.syncActivities();
      await fetchActivities();
      setLastSynced(new Date().toISOString());
      const count = result?.count || 0;
      setSyncMsg({
        text: count > 0 ? `✓ Synced ${count} activit${count === 1 ? 'y' : 'ies'}` : '✓ Already up to date',
        type: 'success',
      });
      setTimeout(() => setSyncMsg({ text: '', type: '' }), 4000);
    } catch (error) {
      setSyncMsg({ text: getErrorMessage(error), type: 'error' });
      setTimeout(() => setSyncMsg({ text: '', type: '' }), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchActivities]);

  useEffect(() => {
    if (searchParams.get('strava_connected') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleSyncActivities();
    }
  }, [searchParams, handleSyncActivities]);

  useEffect(() => {
    fetchActiveGoal();
    fetchActivitiesAndAutoSync();
    fetchWeekEntries();
  }, []);

  // ─── Date helpers ────────────────────────────────────────────
  const today = new Date();
  const todayISO = fmtDateISO(today);

  // ─── Goal computations ───────────────────────────────────────
  const daysToRace = activeGoal?.race_date
    ? Math.max(0, Math.ceil((new Date(activeGoal.race_date) - today) / 86400000))
    : null;
  const weeksOut = daysToRace !== null ? Math.floor(daysToRace / 7) : null;
  const daysRem = daysToRace !== null ? daysToRace % 7 : null;
  const trainingPhase = weeksOut !== null ? getTrainingPhase(weeksOut) : 'Build';
  const pc = PC[trainingPhase];

  const trainingProgress = useMemo(() => {
    if (!activeGoal?.race_date) return 0;
    const raceDate = new Date(activeGoal.race_date);
    const created = new Date(activeGoal.created_at || Date.now());
    const total = raceDate - created;
    const elapsed = today - created;
    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [activeGoal]);

  const targetPaceDisplay = useMemo(() => {
    if (!activeGoal?.target_time_seconds || !activeGoal?.race_distance_meters) return null;
    const secPerKm = activeGoal.target_time_seconds / (activeGoal.race_distance_meters / 1000);
    return fmtPace(secPerKm);
  }, [activeGoal]);

  // ─── Activity computations ───────────────────────────────────
  const startOfWeek = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const thisWeekRuns = useMemo(() =>
    activities.filter(a => a.activity_type === 'run' && new Date(a.start_time) >= startOfWeek),
    [activities, startOfWeek]);

  const weeklyMileage = useMemo(() =>
    parseFloat((thisWeekRuns.reduce((s, a) => s + (a.distance_meters || 0), 0) * 0.000621371).toFixed(1)),
    [thisWeekRuns]);

  const weeklyTarget = useMemo(() => {
    if (!activeGoal) return 30;
    const raceDist = (activeGoal.race_distance_meters || 42195) * 0.000621371;
    const peakMileage = Math.min(raceDist * 3, 60);
    const ramp = Math.min(1, trainingProgress / 80);
    return Math.round(Math.max(10, peakMileage * (0.5 + 0.5 * ramp)));
  }, [activeGoal, trainingProgress]);

  const weeklyMilageDelta = useMemo(() => {
    if (!activities.length) return 0;
    const prevStart = new Date(startOfWeek);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevMiles = activities
      .filter(a => a.activity_type === 'run' && new Date(a.start_time) >= prevStart && new Date(a.start_time) < startOfWeek)
      .reduce((s, a) => s + (a.distance_meters || 0), 0) * 0.000621371;
    return parseFloat((weeklyMileage - prevMiles).toFixed(1));
  }, [activities, weeklyMileage, startOfWeek]);

  const weeklyRunCount = thisWeekRuns.length;

  const trainingLoadScore = useMemo(() => {
    if (!weeklyTarget) return 0;
    return Math.min(100, Math.round((weeklyMileage / weeklyTarget) * 100));
  }, [weeklyMileage, weeklyTarget]);

  const trainingLoadLabel = useMemo(() => {
    if (trainingLoadScore < 30) return 'Light';
    if (trainingLoadScore < 60) return 'Moderate';
    if (trainingLoadScore < 85) return 'High';
    return 'Peak';
  }, [trainingLoadScore]);

  // Aerobic efficiency: pace_secs_per_km / avg_heart_rate per week
  const aerobicEffData = useMemo(() => {
    const weeks = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      const ws = new Date(d);
      ws.setDate(ws.getDate() - ws.getDay());
      ws.setHours(0, 0, 0, 0);
      const key = ws.toISOString().slice(0, 10);
      weeks[key] = { week: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), runs: [] };
    }
    activities
      .filter(a => a.activity_type === 'run' && a.average_pace_seconds_per_km && a.average_heart_rate)
      .forEach(a => {
        const d = new Date(a.start_time);
        const ws = new Date(d);
        ws.setDate(ws.getDate() - ws.getDay());
        const key = ws.toISOString().slice(0, 10);
        if (weeks[key]) weeks[key].runs.push({ pace: a.average_pace_seconds_per_km, hr: a.average_heart_rate });
      });
    return Object.values(weeks).map(w => ({
      week: w.week.replace(/\s+/, '\n'),
      eff: w.runs.length
        ? parseFloat((w.runs.reduce((s, r) => s + r.pace / r.hr, 0) / w.runs.length).toFixed(4))
        : null,
    }));
  }, [activities]);

  const aerobicEffImprovement = useMemo(() => {
    const withData = aerobicEffData.filter(w => w.eff !== null);
    if (withData.length < 2) return null;
    const oldest = withData[0].eff;
    const newest = withData[withData.length - 1].eff;
    // Lower ratio = more efficient (less pace-seconds per HR beat)
    const pctChange = ((oldest - newest) / oldest) * 100;
    return parseFloat(pctChange.toFixed(1));
  }, [aerobicEffData]);

  // Readiness factors
  const consistency = useMemo(() => {
    if (!activities.length) return 0;
    let count = 0;
    for (let w = 0; w < 4; w++) {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay() - w * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      if (activities.filter(a => a.activity_type === 'run' && new Date(a.start_time) >= start && new Date(a.start_time) < end).length >= 3) count++;
    }
    return count * 25;
  }, [activities]);

  const targetPaceRaw = useMemo(() => {
    if (!activeGoal?.target_time_seconds || !activeGoal?.race_distance_meters) return null;
    return activeGoal.target_time_seconds / (activeGoal.race_distance_meters / 1000);
  }, [activeGoal]);

  const currentPaceRaw = useMemo(() => {
    const runs = activities.filter(a => a.activity_type === 'run' && a.average_pace_seconds_per_km);
    if (!runs.length) return null;
    return runs.reduce((s, a) => s + a.average_pace_seconds_per_km, 0) / runs.length;
  }, [activities]);

  const paceDiff = useMemo(() => {
    if (!currentPaceRaw || !targetPaceRaw) return null;
    return Math.round((currentPaceRaw - targetPaceRaw) * 1.60934);
  }, [currentPaceRaw, targetPaceRaw]);

  const readinessFactors = useMemo(() => {
    const volumeScore = Math.min(100, (weeklyMileage / weeklyTarget) * 100);
    let paceScore = 50;
    if (paceDiff !== null) {
      paceScore = Math.abs(paceDiff) <= 5 ? 100 : Math.abs(paceDiff) <= 15 ? 75 : Math.abs(paceDiff) <= 30 ? 50 : 25;
    }
    const longRunScore = (() => {
      if (!activeGoal || !activities.length) return 50;
      const twa = new Date(today);
      twa.setDate(twa.getDate() - 21);
      const longest = Math.max(0, ...activities.filter(a => a.activity_type === 'run' && new Date(a.start_time) >= twa).map(a => a.distance_meters || 0));
      const target = (activeGoal.race_distance_meters || 42195) * 0.6;
      return target > 0 ? Math.min(100, (longest / target) * 100) : 50;
    })();
    let trendScore = 50;
    if (activities.length) {
      const prev = [];
      for (let w = 1; w <= 3; w++) {
        const start = new Date(today);
        start.setDate(start.getDate() - start.getDay() - w * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        prev.push(activities.filter(a => a.activity_type === 'run' && new Date(a.start_time) >= start && new Date(a.start_time) < end).reduce((s, a) => s + (a.distance_meters || 0) * 0.000621371, 0));
      }
      const avg = prev.reduce((a, b) => a + b, 0) / 3;
      if (avg > 0) {
        const ratio = weeklyMileage / avg;
        trendScore = ratio >= 1.1 ? 100 : ratio >= 0.9 ? 75 : ratio >= 0.7 ? 50 : 25;
      }
    }
    const sevenAgo = new Date(today);
    sevenAgo.setDate(sevenAgo.getDate() - 7);
    const crossDays = new Set(activities.filter(a => a.activity_type !== 'run' && new Date(a.start_time) >= sevenAgo).map(a => new Date(a.start_time).toISOString().slice(0, 10))).size;
    const crossScore = Math.min(100, crossDays * 34);
    const composite = Math.round(volumeScore * 0.22 + paceScore * 0.22 + consistency * 0.18 + longRunScore * 0.15 + trendScore * 0.13 + crossScore * 0.10);
    return {
      Volume: Math.round(volumeScore),
      'Aerobic Base': Math.round(paceScore),
      Consistency: Math.round(consistency),
      'Long Run': Math.round(longRunScore),
      Trend: Math.round(trendScore),
      composite: Math.min(100, Math.max(0, composite)),
    };
  }, [weeklyMileage, weeklyTarget, paceDiff, consistency, activities, activeGoal]);

  const readinessScore = readinessFactors.composite;
  const readinessLabel = readinessScore >= 70 ? 'Race Ready' : readinessScore >= 50 ? 'On Track' : 'Building Base';
  const readinessColor = readinessScore >= 70 ? C.green : readinessScore >= 50 ? C.amber : C.red;

  // Weekly mileage chart data (8 weeks)
  const weeklyChartData = useMemo(() => {
    const weeks = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      const ws = new Date(d);
      ws.setDate(ws.getDate() - ws.getDay());
      const key = ws.toISOString().slice(0, 10);
      weeks[key] = {
        week: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '\n'),
        miles: 0,
      };
    }
    activities.filter(a => a.activity_type === 'run').forEach(a => {
      const d = new Date(a.start_time);
      const ws = new Date(d);
      ws.setDate(ws.getDate() - ws.getDay());
      const key = ws.toISOString().slice(0, 10);
      if (weeks[key]) weeks[key].miles += (a.distance_meters || 0) * 0.000621371;
    });
    return Object.values(weeks).map(w => ({ ...w, miles: parseFloat(w.miles.toFixed(1)) }));
  }, [activities]);

  // Effort distribution from avg HR (approximated)
  const effortDist = useMemo(() => {
    const zones = [
      { zone: 'Z1 Easy', label: '< 130 bpm', color: '#5CC8FF', min: 0, max: 130, mins: 0 },
      { zone: 'Z2 Aerobic', label: '130–148', color: C.green, min: 130, max: 148, mins: 0 },
      { zone: 'Z3 Tempo', label: '148–162', color: C.amber, min: 148, max: 162, mins: 0 },
      { zone: 'Z4 Hard', label: '162–174', color: C.coral, min: 162, max: 174, mins: 0 },
      { zone: 'Z5 Max', label: '174+', color: C.red, min: 174, max: 999, mins: 0 },
    ];
    const sevenAgo = new Date(today);
    sevenAgo.setDate(sevenAgo.getDate() - 7);
    const weekRuns = activities.filter(a => a.activity_type === 'run' && a.average_heart_rate && new Date(a.start_time) >= sevenAgo);
    weekRuns.forEach(a => {
      const durationMins = (a.duration_seconds || a.moving_time_seconds || 0) / 60;
      const hr = a.average_heart_rate;
      const zone = zones.find(z => hr >= z.min && hr < z.max);
      if (zone) zone.mins += durationMins;
    });
    const total = zones.reduce((s, z) => s + z.mins, 0) || 1;
    return zones.map(z => ({ ...z, pct: Math.round((z.mins / total) * 100) }));
  }, [activities]);

  // Today's calendar entries (all of them)
  const todayEntries = useMemo(() =>
    weekEntries.filter(e => e.date === todayISO),
    [weekEntries, todayISO]);

  // Primary entry (first planned, or first completed, or null)
  const todayEntry = useMemo(() =>
    todayEntries.find(e => e.status === 'planned') || todayEntries[0] || null,
    [todayEntries]);

  // Additional entries to show below the main card
  const todayExtraEntries = useMemo(() =>
    todayEntries.filter(e => e !== todayEntry),
    [todayEntries, todayEntry]);

  const handleMarkComplete = useCallback(async () => {
    if (!todayEntry) return;
    try {
      await calendarAPI.updateStatus(todayEntry.id, 'completed');
      fetchWeekEntries();
    } catch (e) {
      console.error('Failed to mark workout complete', e);
    }
  }, [todayEntry, fetchWeekEntries]);

  // Calendar strip: Mon-Sun with entries
  const calendarStrip = useMemo(() => {
    const result = [];
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay();
    // Find Monday
    const monday = new Date(todayMidnight);
    monday.setDate(todayMidnight.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = fmtDateISO(d);
      // Prefer calendar entries (planned/completed) over raw activities
      const calEntries = weekEntries.filter(e => e.date === iso);
      const entry = calEntries[0] || null;
      const isToday = iso === todayISO;
      const isPast = d < todayMidnight;
      const dayActivities = activities.filter(a => fmtDateISO(new Date(a.start_time)) === iso);
      const hasActivity = dayActivities.length > 0;

      // If no calendar entry exists for this day, synthesize display from logged activities
      let type = entry?.workout_type || null;
      let title = entry?.title || null;
      let miles = entry?.distance_km
        ? parseFloat((entry.distance_km * 0.621371).toFixed(1))
        : entry?.planned_distance_meters
          ? parseFloat((entry.planned_distance_meters * 0.000621371).toFixed(1))
          : null;

      if (!entry && hasActivity) {
        const act = dayActivities[0];
        const actLabel = act.activity_type === 'run' ? 'Easy'
          : act.activity_type === 'recovery' ? 'Recovery'
          : 'Cross Train';
        type = actLabel;
        title = act.name || actLabel;
        miles = act.distance_meters
          ? parseFloat((act.distance_meters * 0.000621371).toFixed(1))
          : null;
      }

      result.push({
        day: DAY_LABELS[d.getDay()],
        date: String(d.getDate()),
        iso,
        type,
        title,
        miles,
        done: entry?.status === 'completed' || hasActivity,
        today: isToday,
        count: calEntries.length,
      });
    }
    return result;
  }, [weekEntries, activities, todayISO]);

  // Up next: future entries this week
  const upNextEntries = useMemo(() =>
    calendarStrip.filter(d => !d.today && !d.done && d.type && d.type !== 'Rest').slice(0, 3),
    [calendarStrip]);

  // Recent runs
  const recentRuns = useMemo(() =>
    activities
      .filter(a => a.activity_type === 'run')
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 6),
    [activities]);

  // ─── Widget data computations ─────────────────────────────────
  const widgetData = useMemo(() => {
    // Elevation per week
    const elevWeeks = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      const ws = new Date(d);
      ws.setDate(ws.getDate() - ws.getDay());
      const key = ws.toISOString().slice(0, 10);
      elevWeeks[key] = {
        week: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', ''),
        ft: 0,
      };
    }
    let weeklyElevGain = 0, weeklyElevLoss = 0;
    activities.filter(a => a.activity_type === 'run').forEach(a => {
      const ft = Math.round((a.elevation_gain || 0) * 3.28084);
      const d = new Date(a.start_time);
      const ws = new Date(d);
      ws.setDate(ws.getDate() - ws.getDay());
      const key = ws.toISOString().slice(0, 10);
      if (elevWeeks[key]) elevWeeks[key].ft += ft;
      if (new Date(a.start_time) >= startOfWeek) {
        weeklyElevGain += ft;
        weeklyElevLoss += Math.round((a.elevation_loss || a.elevation_gain || 0) * 3.28084);
      }
    });

    // Cadence
    const cadenceRuns = activities.filter(a => a.activity_type === 'run' && (a.average_cadence || a.cadence));
    const avgCadence = cadenceRuns.length
      ? Math.round(cadenceRuns.reduce((s, a) => s + (a.average_cadence || a.cadence || 0), 0) / cadenceRuns.length)
      : 0;
    const cadWeeks = Object.values(elevWeeks).map((w, i) => ({ week: w.week, spm: avgCadence > 0 ? avgCadence + (i - 4) : 170 + (i - 4) }));

    // Calories — compute per-week from activities
    const calWeeks = Object.entries(elevWeeks).map(([key, w]) => {
      const ws = new Date(key);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 7);
      const kcal = Math.round(activities
        .filter(a => new Date(a.start_time) >= ws && new Date(a.start_time) < we)
        .reduce((s, a) => s + (a.calories || 0), 0));
      return { week: w.week, kcal };
    });
    const weekCals = calWeeks[calWeeks.length - 1]?.kcal || 0;

    // HR zones
    const hrZones = [
      { zone: 'Z1 Easy', pct: effortDist[0].pct, color: '#5CC8FF', bpm: '<130' },
      { zone: 'Z2 Aerobic', pct: effortDist[1].pct, color: C.green, bpm: '130–148' },
      { zone: 'Z3 Tempo', pct: effortDist[2].pct, color: C.amber, bpm: '148–162' },
      { zone: 'Z4 Threshold', pct: effortDist[3].pct, color: C.coral, bpm: '162–174' },
      { zone: 'Z5 Max', pct: effortDist[4].pct, color: C.red, bpm: '174+' },
    ];

    // Volume by type
    const typeMap = {};
    activities.filter(a => a.activity_type === 'run').forEach(a => {
      const t = a.workout_type || 'Easy';
      typeMap[t] = (typeMap[t] || 0) + (a.distance_meters || 0) * 0.000621371;
    });
    const typeColors = { Easy: C.blue, 'Long Run': C.navy, Tempo: C.coral, Intervals: C.amber, Recovery: C.green };
    const volumeByType = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type, miles]) => ({ type, miles: parseFloat(miles.toFixed(1)), color: typeColors[type] || C.gray400 }));

    // Streak
    const allWeeks = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay() - w * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const runs = activities.filter(a => a.activity_type === 'run' && new Date(a.start_time) >= start && new Date(a.start_time) < end).length;
      allWeeks.push({ week: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', ''), runs });
    }
    let streak = 0, longest = 0, cur = 0;
    for (const w of allWeeks) {
      if (w.runs >= 3) { cur++; streak = cur; longest = Math.max(longest, cur); }
      else cur = 0;
    }

    // Monthly
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthName = today.toLocaleDateString('en-US', { month: 'long' });
    const monthActual = parseFloat((activities.filter(a => a.activity_type === 'run' && new Date(a.start_time) >= monthStart).reduce((s, a) => s + (a.distance_meters || 0) * 0.000621371, 0)).toFixed(1));
    const monthTarget = weeklyTarget * 4;
    const byWeek = ['W1', 'W2', 'W3', 'W4'].map((wk, i) => {
      const ws = new Date(monthStart);
      ws.setDate(monthStart.getDate() + i * 7);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 7);
      const actual = parseFloat((activities.filter(a => a.activity_type === 'run' && new Date(a.start_time) >= ws && new Date(a.start_time) < we).reduce((s, a) => s + (a.distance_meters || 0) * 0.000621371, 0)).toFixed(1));
      return { week: wk, planned: weeklyTarget, actual };
    });

    // PRs — best estimated time for each standard distance (±15% tolerance)
    const PR_DISTS = [
      { label: '5K', km: 5.0 },
      { label: '10K', km: 10.0 },
      { label: 'Half', km: 21.1 },
      { label: 'Marathon', km: 42.2 },
    ];
    const prs = PR_DISTS.map(d => {
      const candidates = activities.filter(a => {
        if (a.activity_type !== 'run' || !a.average_pace_seconds_per_km) return false;
        const km = (a.distance_meters || 0) / 1000;
        return Math.abs(km - d.km) / d.km <= 0.15;
      });
      if (!candidates.length) return { label: d.label, pr: null };
      const best = candidates.reduce((b, a) => {
        const est = a.average_pace_seconds_per_km * d.km;
        return !b || est < b.est ? { est, date: a.start_time } : b;
      }, null);
      return { label: d.label, pr: best ? { time: Math.round(best.est), date: best.date } : null };
    });

    // Recent paces — last 8 runs
    const recentPaces = activities
      .filter(a => a.activity_type === 'run' && a.average_pace_seconds_per_km && (a.distance_meters || 0) > 500)
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 8)
      .reverse()
      .map(a => ({
        date: new Date(a.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pace: a.average_pace_seconds_per_km,
        miles: parseFloat(((a.distance_meters || 0) * 0.000621371).toFixed(1)),
      }));

    return {
      elevation: { weeklyGain: weeklyElevGain || 0, weeklyLoss: weeklyElevLoss || 0, trend: Object.values(elevWeeks) },
      cadence: { avgSPM: avgCadence || 174, goal: 180, trend: cadWeeks, byActivity: [{ type: 'Easy', spm: avgCadence || 170 }, { type: 'Tempo', spm: (avgCadence || 170) + 6 }, { type: 'Long', spm: avgCadence || 172 }, { type: 'Intervals', spm: (avgCadence || 170) + 10 }] },
      calories: { weeklyBurn: weekCals || 0, weeklyTarget: weeklyTarget * 120, trend: calWeeks.slice(-8) },
      hrZones,
      volumeByType: volumeByType.length ? volumeByType : [{ type: 'Easy', miles: 0, color: C.blue }],
      consistency: { streak, longestStreak: longest, weeklyTarget: 3, weeks: allWeeks.slice(-8) },
      monthly: { monthName, actual: monthActual, target: monthTarget, byWeek },
      prs,
      recentPaces,
    };
  }, [activities, effortDist, weeklyTarget, startOfWeek]);

  // ─── Render ──────────────────────────────────────────────────
  const todayWorkoutMiles = todayEntry?.distance_km
    ? parseFloat((todayEntry.distance_km * 0.621371).toFixed(1))
    : null;
  const todayWorkoutType = todayEntry?.workout_type || null;
  const todaySegments = todayWorkoutType ? getWorkoutSegments(todayWorkoutType, todayWorkoutMiles) : null;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button{cursor:pointer;transition:opacity 0.15s}
        .nb:hover{color:white!important;background:rgba(255,255,255,0.1)!important}
        @keyframes krs-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .krs-rr:hover { background: ${C.gray50} !important; cursor: pointer }
        .krs-cal:hover { background: ${C.gray50} !important }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.gray200}; border-radius: 3px; }
      `}</style>

      {/* ── TOOLBAR ── */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.gray100}`, padding: '14px 24px' }}>
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handlePlanWorkout}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: C.coral, border: 'none',
                borderRadius: 10, padding: '9px 18px',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
                color: C.white, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(232,99,74,0.35)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Plan Activity
            </button>
            {syncMsg.text && (
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
                color: syncMsg.type === 'success' ? C.green : C.red,
              }}>{syncMsg.text}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SyncDropdown isSyncing={isSyncing} onSync={handleSyncActivities} />
            <WidgetSelector active={activeWidgets} toggle={toggleWidget} />
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ width: '100%', padding: '24px 24px' }}>
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── GOAL HERO CARD ── */}
        <Card style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {activeGoal ? (
            <>
              {/* Left: race identity */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 4, height: 50, background: C.coral, borderRadius: 99, flexShrink: 0 }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 22, color: C.navy, letterSpacing: "-0.02em", lineHeight: 1 }}>{activeGoal.race_name}</span>
                    <div style={{ background: pc.badge, borderRadius: 6, padding: "3px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: pc.accent }} />
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: pc.label }}>{trainingPhase} Phase</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400 }}>
                      {activeGoal.race_date ? new Date(activeGoal.race_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 110, height: 3, background: C.gray100, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${trainingProgress}%`, height: "100%", background: `linear-gradient(90deg,${C.coral},#f2a040)`, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: C.gray400 }}>{trainingProgress}% done</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center: target + goal pace */}
              <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                {[
                  { label: "TARGET TIME", value: activeGoal.target_time_seconds ? fmtTargetTime(activeGoal.target_time_seconds) : "—", sub: "finish goal" },
                  { label: "GOAL PACE", value: targetPaceDisplay || "—", sub: "avg per mile" },
                ].map((stat, i) => (
                  <div key={i} style={{ padding: "0 24px", borderLeft: i > 0 ? `1px solid ${C.gray100}` : undefined, textAlign: "center" }}>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>{stat.label}</div>
                    <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: C.gray400, marginTop: 3 }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Right: countdown */}
              {daysToRace !== null && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "flex-end" }}>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 32, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{weeksOut}</span>
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400 }}>w</span>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, fontWeight: 700, color: C.gray400, lineHeight: 1 }}>{daysRem}</span>
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400 }}>d</span>
                  </div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: C.gray400, textAlign: "right", marginTop: 1 }}>to race day</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 4, height: 50, background: C.gray200, borderRadius: 99 }} />
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: C.gray400, marginBottom: 4 }}>No active goal</div>
                <Link to="/goals" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: C.coral, fontWeight: 600, textDecoration: 'none' }}>Set a race goal →</Link>
              </div>
            </div>
          )}
          </div>
        </Card>

        {/* ── GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 316px', gap: 22 }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

            {/* ① WEEK CALENDAR STRIP */}
            <div>
              <SLabel action={
                <Link to="/calendar" style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: C.coral, background: "none", border: "none", textDecoration: "none", cursor: "pointer" }}>
                  Full Calendar →
                </Link>
              }>This Week's Plan</SLabel>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                  {calendarStrip.map((d, i) => {
                    const s = WC[d.type] || WC.Easy;
                    const isT = d.today;
                    return (
                      <div key={i} className={isT ? "" : "krs-cal"} style={{
                        padding: "18px 8px 16px", textAlign: "center",
                        background: isT ? C.navy : "transparent",
                        borderRight: i < 6 ? `1px solid ${C.gray100}` : "none",
                        position: "relative", cursor: "default", transition: "background 0.15s",
                      }}>
                        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 700, color: isT ? "rgba(255,255,255,0.4)" : C.gray400, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{d.day}</div>
                        {/* Big date number */}
                        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 28, fontWeight: 700, color: isT ? C.white : C.navy, lineHeight: 1, marginBottom: 10 }}>{d.date}</div>
                        {/* Workout pill */}
                        <div style={{ marginBottom: 8 }}>
                          {d.type ? (
                            <span style={{ background: isT ? "rgba(255,255,255,0.12)" : s.bg, color: isT ? C.white : s.text, borderRadius: 5, padding: "3px 7px", fontSize: 9, fontFamily: "DM Sans, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {d.type}
                            </span>
                          ) : (
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: isT ? "rgba(255,255,255,0.2)" : C.gray200 }}>Rest</span>
                          )}
                        </div>
                        {/* Miles */}
                        {d.miles ? (
                          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 16, fontWeight: 600, color: isT ? C.coral : C.navy }}>
                            {d.miles}<span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: isT ? "rgba(255,255,255,0.3)" : C.gray400 }}> mi</span>
                          </div>
                        ) : (
                          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: isT ? "rgba(255,255,255,0.2)" : C.gray200 }}>
                            {d.type ? "—" : "Rest"}
                          </div>
                        )}
                        {/* Activity count badge */}
                        {d.count > 1 && (
                          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, fontWeight: 700, color: isT ? "rgba(255,255,255,0.5)" : C.gray400, marginTop: 4 }}>
                            +{d.count - 1} more
                          </div>
                        )}
                        {/* Done dot */}
                        {d.done && <div style={{ position: "absolute", top: 10, right: 10, width: 7, height: 7, borderRadius: "50%", background: C.green }} />}
                        {/* Today indicator */}
                        {isT && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, background: C.coral, borderRadius: 99 }} />}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* ② TODAY'S WORKOUT */}
            <div>
              <SLabel>Today's Workout</SLabel>
              {todayEntry ? (
                <div style={{ background: C.navy, borderRadius: 16, overflow: "hidden", position: "relative", boxShadow: "0 6px 24px rgba(27,37,89,0.15)" }}>
                  {/* Accent bar */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: C.coral }} />
                  {/* Background graphic */}
                  <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.05, pointerEvents: "none" }}>
                    <svg width="200" height="200" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="20" /></svg>
                  </div>
                  <div style={{ padding: "24px 24px 24px 30px", position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                          </span>
                          {todayEntry.status === 'completed' && <span style={{ background: "rgba(46,204,139,0.15)", color: C.green, borderRadius: 5, padding: "3px 8px", fontSize: 10, fontFamily: "DM Sans, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Done</span>}
                        </div>
                        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, color: C.white, lineHeight: 1.1 }}>
                          {todayWorkoutType === 'Rest' ? 'Rest Day' : todayWorkoutType === 'Cross Train' ? 'Cross Training' : `${todayWorkoutMiles} mi ${todayWorkoutType}`}
                        </div>
                        {todayEntry.title && (
                          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginTop: 10 }}>
                            {todayEntry.title}
                          </div>
                        )}
                      </div>
                      {todayEntry.status !== 'completed' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                          <button onClick={handleMarkComplete} style={{ background: C.green, color: C.white, border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>✓</span> Mark Done
                          </button>
                          <button onClick={handlePlanWorkout} style={{ background: "rgba(255,255,255,0.1)", color: C.white, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            Plan Activity
                          </button>
                        </div>
                      )}
                    </div>
                    {todaySegments && todaySegments.length > 0 && (
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Workout Structure</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {todaySegments.map((seg, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.type === 'warmup' || seg.type === 'cooldown' ? "rgba(255,255,255,0.2)" : C.coral }} />
                              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 14, fontWeight: 700, color: C.white, width: 45 }}>{seg.type === 'rest' ? '—' : seg.miles + 'm'}</div>
                              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{seg.desc || seg.detail}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140, background: "rgba(255,255,255,0.5)", border: `1px dashed ${C.gray200}`, boxShadow: "none" }}>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: C.gray400 }}>No workout scheduled for today</div>
                </Card>
              )}

              {/* Additional today entries (cross-training, extra activities, etc.) */}
              {todayExtraEntries.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {todayExtraEntries.map(entry => {
                    const distMi = entry.planned_distance_meters
                      ? parseFloat((entry.planned_distance_meters * 0.000621371).toFixed(1))
                      : null;
                    const typeLabel = entry.workout_type
                      ? entry.workout_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      : 'Activity';
                    return (
                      <div key={entry.id} style={{
                        background: C.white, borderRadius: 12, padding: "14px 16px",
                        border: `1px solid ${C.gray100}`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        boxShadow: "0 1px 4px rgba(27,37,89,0.06)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                            background: entry.status === 'completed' ? C.green : C.amber,
                          }} />
                          <div>
                            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, color: C.navy }}>
                              {entry.title || typeLabel}
                            </div>
                            {distMi && (
                              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: C.gray400, marginTop: 2 }}>
                                {distMi} mi
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            padding: "3px 8px", borderRadius: 5,
                            background: entry.status === 'completed' ? "rgba(46,204,139,0.12)" : "rgba(229,168,48,0.12)",
                            color: entry.status === 'completed' ? C.green : C.amber,
                          }}>
                            {entry.status === 'completed' ? 'Done' : typeLabel}
                          </span>
                          {entry.status !== 'completed' && (
                            <button
                              onClick={() => calendarAPI.updateStatus(entry.id, 'completed').then(fetchWeekEntries)}
                              style={{
                                background: C.green, color: C.white, border: "none",
                                borderRadius: 6, padding: "4px 10px",
                                fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer",
                              }}
                            >✓</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ③ METRIC CARDS */}
            <div>
              <SLabel>This Week</SLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {/* Weekly Mileage */}
                <Card>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Weekly Mileage</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 42, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{weeklyMileage}</span>
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: C.gray400, fontWeight: 600 }}>mi</span>
                  </div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400, marginBottom: 16 }}>of {weeklyTarget} mi planned</div>
                  <div style={{ height: 6, background: C.gray100, borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: `${Math.min(100, (weeklyMileage / weeklyTarget) * 100)}%`, height: "100%", background: C.navy, borderRadius: 99 }} />
                  </div>
                  {weeklyMilageDelta !== 0 && (
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: weeklyMilageDelta > 0 ? C.green : C.amber }}>
                      {weeklyMilageDelta > 0 ? "▲" : "▼"} {Math.abs(weeklyMilageDelta)} mi vs last week
                    </span>
                  )}
                </Card>

                {/* Aerobic Efficiency */}
                <Card>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Aerobic Efficiency</div>
                  {aerobicEffImprovement !== null ? (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 42, fontWeight: 700, color: aerobicEffImprovement >= 0 ? C.navy : C.amber, lineHeight: 1 }}>
                          {aerobicEffImprovement > 0 ? "+" : ""}{aerobicEffImprovement}<span style={{ fontSize: 22 }}>%</span>
                        </span>
                      </div>
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400, marginBottom: 14 }}>faster at same HR vs 8 weeks ago</div>
                      <ResponsiveContainer width="100%" height={36} style={{ marginBottom: 12 }}>
                        <LineChart data={aerobicEffData.filter(w => w.eff !== null)}>
                          <YAxis domain={['dataMin - 0.001', 'dataMax + 0.001']} hide />
                          <Line type="monotone" dataKey="eff" stroke={aerobicEffImprovement >= 0 ? C.green : C.amber} strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: aerobicEffImprovement >= 0 ? C.green : C.amber }}>
                        {aerobicEffImprovement >= 0 ? "▲ Aerobic engine improving" : "▼ Monitor training stress"}
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 42, fontWeight: 700, color: C.gray200, lineHeight: 1, marginBottom: 10 }}>—</div>
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400 }}>Sync HR data to track aerobic efficiency</div>
                    </>
                  )}
                </Card>

                {/* Training Load */}
                <Card>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Training Load</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 42, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{trainingLoadScore}</span>
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 16, fontWeight: 700, color: trainingLoadScore >= 85 ? C.coral : trainingLoadScore >= 60 ? C.amber : C.green }}>{trainingLoadLabel}</span>
                  </div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400, marginBottom: 16 }}>Volume vs target · {weeklyRunCount} run{weeklyRunCount !== 1 ? 's' : ''} this week</div>
                  <div style={{ height: 6, background: C.gray100, borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: `${trainingLoadScore}%`, height: "100%", background: `linear-gradient(90deg,${C.green},${C.amber})`, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: C.green }}>
                    {trainingLoadScore >= 60 ? "▲ Trending up" : "— Building volume"}
                  </span>
                </Card>
              </div>
            </div>

            {/* ④ TRAINING TRENDS */}
            <div>
              <SLabel>Training Trends</SLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Weekly Mileage chart */}
                <Card>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Weekly Mileage</div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400, marginBottom: 20 }}>8-week history</div>
                  {weeklyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={weeklyChartData} barSize={20} barCategoryGap="20%">
                        <XAxis dataKey="week" tick={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fill: C.gray400 }} axisLine={false} tickLine={false} tickMargin={8} />
                        <YAxis hide />
                        <Tooltip content={({ active, payload, label }) => <Tip active={active} payload={payload} label={label} unit=" mi" />} cursor={{ fill: "rgba(27,37,89,0.02)" }} />
                        <Bar dataKey="miles" radius={[4, 4, 0, 0]}>
                          {weeklyChartData.map((_, idx) => (
                            <Cell key={idx} fill={idx === weeklyChartData.length - 1 ? C.coral : C.navy} fillOpacity={idx === weeklyChartData.length - 1 ? 1 : 0.4} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", fontSize: 13, color: C.gray400 }}>
                      No data — sync your activities
                    </div>
                  )}
                </Card>

                {/* Effort Distribution */}
                <Card>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Effort Distribution</div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray400, marginBottom: 20 }}>
                    Time in zone this week · {effortDist.reduce((s, z) => s + z.mins, 0) > 0 ? `${Math.round(effortDist.reduce((s, z) => s + z.mins, 0))} min total` : "No data yet"}
                  </div>
                  {effortDist.map((z, i) => {
                    const onTarget = z.pct >= 10;
                    return (
                      <div key={i} style={{ marginBottom: i < effortDist.length - 1 ? 14 : 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600, color: C.gray600 }}>{z.zone}</span>
                            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: C.gray400 }}>{z.label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {z.mins > 0 && <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: C.gray400 }}>{Math.round(z.mins)}m</span>}
                            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 700, color: C.navy }}>{z.pct}%</span>
                            {onTarget && <span style={{ fontSize: 12, color: C.green, fontWeight: 700, marginLeft: 2 }}>✓</span>}
                          </div>
                        </div>
                        <div style={{ height: 6, background: C.gray100, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${z.pct}%`, height: "100%", background: z.color, borderRadius: 99 }} />
                        </div>
                      </div>
                    );
                  })}
                  {effortDist.length > 0 && effortDist[0].pct + effortDist[1].pct > 0 && (
                    <div style={{ marginTop: 16, padding: "10px 12px", background: C.gray50, borderRadius: 8 }}>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: C.gray600 }}>
                        💡 Z1+Z2 = <span style={{ fontWeight: 700, color: C.green }}>{effortDist[0].pct + effortDist[1].pct}%</span>
                        {effortDist[0].pct + effortDist[1].pct >= 70 ? " — precise aerobic base building" : " — aim for 70%+ in Z1–Z2"}
                      </span>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* ⑤ RECENT RUNS */}
            <div>
              <SLabel action={<span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: C.gray400 }}>via Strava</span>}>Recent Runs</SLabel>
              {recentRuns.length > 0 ? (
                <Card style={{ padding: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 100px 1fr 90px 90px 80px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.gray100}` }}>
                    {["Date", "Type", "Distance", "Pace", "Time", "HR", "Elev"].map((h, i) => (
                      <span key={h} style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.09em", textAlign: i >= 2 ? "right" : "left" }}>{h}</span>
                    ))}
                  </div>
                  {recentRuns.map((r, i) => {
                    const hr = r.average_heart_rate;
                    const hrColor = hr >= 165 ? C.red : hr <= 145 ? C.green : C.amber;
                    const distMi = parseFloat(((r.distance_meters || 0) * 0.000621371).toFixed(1));
                    const elevFt = Math.round((r.elevation_gain || 0) * 3.28084);
                    const runType = r.workout_type || 'Easy';
                    return (
                      <div key={i} className="krs-rr" style={{
                        display: "grid", gridTemplateColumns: "100px 100px 1fr 90px 90px 80px 80px",
                        padding: "16px 24px", alignItems: "center",
                        background: "transparent",
                        borderBottom: i < recentRuns.length - 1 ? `1px solid ${C.gray50}` : "none",
                        transition: "background 0.12s",
                      }}>
                        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, color: C.gray600 }}>
                          {new Date(r.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span><Pill type={runType} /></span>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20, fontWeight: 700, color: C.navy, textAlign: "right" }}>
                          {distMi}<span style={{ fontSize: 12, fontWeight: 500, color: C.gray400 }}> mi</span>
                        </span>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 14, color: C.navy, textAlign: "right" }}>
                          {fmtPace(r.average_pace_seconds_per_km)}
                        </span>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: C.gray600, textAlign: "right" }}>
                          {r.duration_seconds ? fmtTime(r.duration_seconds) : r.moving_time_seconds ? fmtTime(r.moving_time_seconds) : "—"}
                        </span>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 600, color: hr ? hrColor : C.gray400, textAlign: "right" }}>
                          {hr ? <>{hr}<span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 500, color: C.gray400 }}> bpm</span></> : "—"}
                        </span>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: C.blue, textAlign: "right" }}>
                          {elevFt > 0 ? <>↑{elevFt}<span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: C.gray400 }}> ft</span></> : "—"}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              ) : (
                <Card>
                  <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "DM Sans, sans-serif", fontSize: 14, color: C.gray400 }}>
                    No runs yet — sync your Strava activities to see them here
                  </div>
                </Card>
              )}
            </div>

            {/* ⑥ OPTIONAL WIDGET GRID */}
            <WidgetGrid active={activeWidgets} computedData={widgetData} />
          </div >

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Race Readiness */}
            <Card>
              <SLabel>Race Readiness</SLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <Gauge score={readinessScore} />
                <div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: readinessColor, marginBottom: 4, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{readinessLabel}</div>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: C.gray600, lineHeight: 1.5 }}>
                    {readinessScore >= 70
                      ? 'Strong base. Stay consistent and taper well.'
                      : readinessScore >= 50
                        ? 'Good progress. Keep building your long run and weekly volume.'
                        : 'Focus on consistency and gradual mileage increases.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFactors(!showFactors)} style={{
                width: "100%", background: C.gray50, border: `1px solid ${C.gray100}`,
                borderRadius: 10, padding: "10px", fontFamily: "DM Sans, sans-serif",
                fontSize: 12, fontWeight: 700, color: C.gray600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {showFactors ? 'Hide' : 'Show'} breakdown
                <span style={{ display: "inline-block", transform: showFactors ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>▾</span>
              </button>
              {showFactors && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(readinessFactors).filter(([k]) => k !== 'composite').map(([name, score]) => (
                    <div key={name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: C.gray600 }}>{name}</span>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 700, color: score >= 70 ? C.green : score >= 50 ? C.amber : C.red }}>{score}</span>
                      </div>
                      <div style={{ height: 6, background: C.gray100, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${score}%`, height: "100%", background: score >= 70 ? C.green : score >= 50 ? C.amber : C.red, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Coach Insight */}
            <div style={{ background: C.navy, borderRadius: 16, padding: "20px 24px", boxShadow: "0 6px 24px rgba(27,37,89,0.15)", borderLeft: `6px solid ${C.coral}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Coach Insight</span>
              </div>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: 16 }}>
                {coachInsight || 'Sync your training data and visit the Coach to get personalized insights about your fitness and race preparation.'}
              </p>
              <Link to="/coach" style={{
                display: "block", width: "100%", textAlign: "center",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10, padding: "10px", fontFamily: "DM Sans, sans-serif",
                fontSize: 13, fontWeight: 600, color: C.white, textDecoration: "none",
              }}>Ask Coach →</Link>
            </div>

            {/* Up Next */}
            {upNextEntries.length > 0 && (
              <Card>
                <SLabel>Up Next</SLabel>
                {upNextEntries.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < upNextEntries.length - 1 ? `1px solid ${C.gray100}` : "none" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: C.gray50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, color: C.gray400, textTransform: "uppercase", fontWeight: 700, lineHeight: 1, marginBottom: 2 }}>{d.day}</span>
                      <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{d.date}</span>
                    </div>
                    <div>
                      {d.type && <Pill type={d.type} sm />}
                      {d.miles && <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: C.gray600, marginTop: 4 }}>{d.miles} miles</div>}
                      {!d.miles && d.title && <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: C.gray600, marginTop: 4 }}>{d.title}</div>}
                    </div>
                  </div>
                ))}
              </Card>
            )}

          </div>
        </div>
        </div>
      </div>

      <SessionDetailsModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSave={handleSavePlan}
        onDelete={() => {}}
        entry={null}
        selectedDate={todayISO}
      />
    </div>
  );
};

export default Dashboard;
