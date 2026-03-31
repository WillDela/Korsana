import { useState, useEffect } from 'react';
import { crossTrainingAPI } from '../../../api/dashboard';
import { crossTrainingGoalsAPI } from '../../../api/crossTrainingGoals';
import BrandIcon from '../../BrandIcon';

const TYPE_CONFIG = {
  weight_lifting: { icon: '🏋', label: 'Weight Training' },
  cycling:        { icon: '🚴', label: 'Cycling' },
  swimming:       { icon: '🏊', label: 'Swimming' },
  elliptical:     { icon: '🔄', label: 'Elliptical' },
};

const inputClass = 'w-full px-[10px] py-2 rounded-lg border border-[var(--color-border-light)] font-sans text-[12px] box-border';

export default function CrossTrainingWidget({ data, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: 'weight_lifting',
    date: new Date().toISOString().slice(0, 10),
    duration_minutes: 45,
    intensity: 'moderate',
    distance_meters: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [goals, setGoals] = useState({});

  useEffect(() => {
    crossTrainingGoalsAPI.getGoals().then((data) => {
      const map = {};
      (data || []).forEach(g => { map[g.activity_type] = g.sessions_per_week; });
      setGoals(map);
    }).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await crossTrainingAPI.delete(id);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        date: form.date,
        duration_minutes: parseInt(form.duration_minutes) || 45,
      };
      if (form.type === 'weight_lifting' && form.intensity) {
        payload.intensity = form.intensity;
      }
      if (['cycling', 'swimming'].includes(form.type) && form.distance_meters) {
        payload.distance_meters = parseFloat(form.distance_meters);
      }
      if (form.notes) payload.notes = form.notes;
      await crossTrainingAPI.create(payload);
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const sessions = data?.sessions || [];
  const counts = data?.monthly_counts || {};

  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const weeklyCounts = sessions.reduce((acc, s) => {
    if (s.date && new Date(s.date) >= weekStart) acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="widget-card">
      <div className="flex justify-between items-center mb-4">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Cross-Training
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="bg-coral border-0 rounded-lg px-[14px] py-[6px] font-sans text-[11px] font-bold text-white cursor-pointer"
        >
          + Add Session
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const target = goals[type];
          const weekly = weeklyCounts[type] || 0;
          return (
            <div key={type} className="flex-1 text-center bg-[var(--color-bg-elevated)] rounded-[10px] py-[10px] px-1">
              <div style={{ fontSize: 20 }}>{cfg.icon}</div>
              <div className="font-mono text-[16px] font-bold text-navy mt-1">{counts[type] || 0}</div>
              <div className="font-sans text-[9px] text-[var(--color-text-muted)] mt-[2px]">{cfg.label}</div>
              {target > 0 && (
                <div className="mt-[6px] px-1">
                  <div className="font-mono text-[9px] text-[var(--color-text-muted)]">{weekly}/{target}/wk</div>
                  <div className="mt-[3px] h-[3px] rounded-full bg-[var(--color-border-light)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sage"
                      style={{ width: `${Math.min(100, (weekly / target) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center py-4 gap-[6px]">
          <span style={{ fontSize: 24 }}>📭</span>
          <div className="font-sans text-[12px] text-[var(--color-text-muted)]">
            No sessions in the last 4 weeks
          </div>
        </div>
      ) : (
        <div>
          <div
            className="grid gap-2 px-2 mb-1"
            style={{ gridTemplateColumns: '72px 1fr 60px 72px 20px 20px' }}
          >
            {['Date', 'Type', 'Duration', 'Details', 'Src', ''].map((h, i) => (
              <div key={i} className="font-sans text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.05em]">
                {h}
              </div>
            ))}
          </div>
          {sessions.slice(0, 8).map((s, i) => (
            <div
              key={s.id || i}
              className="grid gap-2 px-2 py-2 rounded-lg items-center"
              style={{
                gridTemplateColumns: '72px 1fr 60px 72px 20px 20px',
                background: i % 2 === 0 ? 'var(--color-bg-elevated)' : 'transparent',
              }}
            >
              <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                {s.date
                  ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '--'}
              </span>
              <span className="font-sans text-[11px] text-navy">
                {TYPE_CONFIG[s.type]?.label ||
                  TYPE_CONFIG[s.type === 'weightlifting' ? 'weight_lifting' : s.type]?.label ||
                  s.type}
              </span>
              <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                {s.duration_minutes}min
              </span>
              <span className="font-sans text-[10px] text-[var(--color-text-muted)]">
                {s.intensity || (s.distance_meters ? `${(s.distance_meters / 1000).toFixed(1)}km` : '—')}
              </span>
              <span className="flex items-center justify-center">
                {s.source === 'strava'
                  ? <BrandIcon brand="strava" size={12} />
                  : <span className="font-sans text-[10px] text-[var(--color-text-muted)]">✎</span>
                }
              </span>
              <span className="flex items-center justify-center">
                {s.source !== 'strava' && (
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="bg-transparent border-none cursor-pointer p-0 text-[var(--color-text-muted)] hover:text-coral transition-colors"
                    title="Delete session"
                  >
                    {deletingId === s.id ? (
                      <span className="text-[10px]">…</span>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    )}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 font-sans text-[10px] text-[var(--color-text-muted)]">
        Note: Heavy lifting sessions may add fatigue — log them to track load accurately.
      </div>

      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/35 z-[1000]"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[18px] px-8 py-7 z-[1001] w-[380px] shadow-[0_8px_40px_rgba(27,37,89,0.2)]">
            <div className="font-sans text-[14px] font-bold text-navy mb-5">
              Log Cross-Training Session
            </div>
            {[
              { label: 'Activity Type', field: 'type', type: 'select', options: Object.keys(TYPE_CONFIG) },
              { label: 'Date', field: 'date', type: 'date' },
              { label: 'Duration (minutes)', field: 'duration_minutes', type: 'number' },
            ].map(({ label, field, type, options }) => (
              <div key={field} className="mb-[14px]">
                <label className="font-sans text-[11px] text-[var(--color-text-muted)] block mb-1">
                  {label}
                </label>
                {type === 'select' ? (
                  <select
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className={inputClass}
                  >
                    {options.map(o => (
                      <option key={o} value={o}>{TYPE_CONFIG[o]?.label || o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
            {form.type === 'weight_lifting' && (
              <div className="mb-[14px]">
                <label className="font-sans text-[11px] text-[var(--color-text-muted)] block mb-1">
                  Intensity
                </label>
                <select
                  value={form.intensity}
                  onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))}
                  className={inputClass}
                >
                  {['light', 'moderate', 'heavy'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            )}
            {['cycling', 'swimming'].includes(form.type) && (
              <div className="mb-[14px]">
                <label className="font-sans text-[11px] text-[var(--color-text-muted)] block mb-1">
                  Distance (meters)
                </label>
                <input
                  type="number"
                  value={form.distance_meters}
                  onChange={e => setForm(f => ({ ...f, distance_meters: e.target.value }))}
                  className={inputClass}
                />
              </div>
            )}
            <div className="mb-5">
              <label className="font-sans text-[11px] text-[var(--color-text-muted)] block mb-1">
                Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="flex gap-[10px]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-[10px] rounded-[10px] border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] font-sans text-[12px] font-semibold text-[var(--color-text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-[10px] rounded-[10px] border-0 bg-navy font-sans text-[12px] font-bold text-white cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
