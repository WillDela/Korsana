import { useState } from 'react';
import { crossTrainingAPI } from '../../../api/dashboard';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray200: "#D4D8E8", gray400: "#8B93B0",
  gray600: "#4A5173", white: "#FFFFFF", green: "#2ECC8B",
  amber: "#F5A623",
};

const TYPE_ICONS = {
  weightlifting: '🏋', cycling: '🚴',
  swimming: '🏊', elliptical: '🔄',
};

export default function CrossTrainingWidget({ data, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: 'weightlifting',
    date: new Date().toISOString().slice(0, 10),
    duration_minutes: 45,
    intensity: 'moderate',
    distance_meters: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        date: form.date,
        duration_minutes: parseInt(form.duration_minutes) || 45,
      };
      if (form.type === 'weightlifting' && form.intensity) {
        payload.intensity = form.intensity;
      }
      if (
        ['cycling', 'swimming'].includes(form.type) &&
        form.distance_meters
      ) {
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

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 10,
          fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>Cross-Training</span>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: C.coral, border: 'none', borderRadius: 8,
            padding: '6px 14px', fontFamily: 'DM Sans, sans-serif',
            fontSize: 11, fontWeight: 700, color: C.white,
            cursor: 'pointer',
          }}
        >+ Add Session</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {Object.entries(TYPE_ICONS).map(([type, icon]) => (
          <div key={type} style={{
            flex: 1, textAlign: 'center', background: C.gray50,
            borderRadius: 10, padding: '10px 4px',
          }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div style={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 16,
              fontWeight: 700, color: C.navy, marginTop: 4,
            }}>{counts[type] || 0}</div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 9,
              color: C.gray400, marginTop: 2, textTransform: 'capitalize',
            }}>{type}</div>
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 0', gap: 6,
        }}>
          <span style={{ fontSize: 24 }}>📭</span>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            color: C.gray400,
          }}>No sessions in the last 4 weeks</div>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 70px 80px 24px',
            gap: 8, padding: '6px 8px', marginBottom: 4,
          }}>
            {['Date', 'Type', 'Duration', 'Details', 'Src'].map(h => (
              <div key={h} style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 9,
                fontWeight: 700, color: C.gray400,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{h}</div>
            ))}
          </div>
          {sessions.slice(0, 8).map((s, i) => (
            <div key={s.id || i} style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 70px 80px 24px',
              gap: 8, padding: '8px 8px', borderRadius: 8,
              background: i % 2 === 0 ? C.gray50 : C.white,
              alignItems: 'center',
            }}>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                color: C.gray600,
              }}>
                {s.date
                  ? new Date(s.date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })
                  : '--'}
              </span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                color: C.navy, textTransform: 'capitalize',
              }}>{s.type}</span>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                color: C.gray600,
              }}>{s.duration_minutes}min</span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                color: C.gray400,
              }}>
                {s.intensity ||
                  (s.distance_meters
                    ? `${(s.distance_meters / 1000).toFixed(1)}km`
                    : '—')}
              </span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                color: s.source === 'strava' ? '#FC4C02' : C.gray400,
              }}>{s.source === 'strava' ? 'S' : '✎'}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 10,
        color: C.gray400,
      }}>
        Note: Heavy lifting sessions may add fatigue — log them to track
        load accurately.
      </div>

      {showModal && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.35)', zIndex: 1000,
            }}
            onClick={() => setShowModal(false)}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', background: C.white,
            borderRadius: 18, padding: '28px 32px', zIndex: 1001,
            width: 380,
            boxShadow: '0 8px 40px rgba(27,37,89,0.2)',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 14,
              fontWeight: 700, color: C.navy, marginBottom: 20,
            }}>Log Cross-Training Session</div>
            {[
              {
                label: 'Activity Type', field: 'type', type: 'select',
                options: Object.keys(TYPE_ICONS),
              },
              { label: 'Date', field: 'date', type: 'date' },
              {
                label: 'Duration (minutes)', field: 'duration_minutes',
                type: 'number',
              },
            ].map(({ label, field, type, options }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                  color: C.gray400, display: 'block', marginBottom: 4,
                }}>{label}</label>
                {type === 'select' ? (
                  <select
                    value={form[field]}
                    onChange={e =>
                      setForm(f => ({ ...f, [field]: e.target.value }))
                    }
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1px solid ${C.gray200}`,
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  >
                    {options.map(o => (
                      <option
                        key={o} value={o}
                        style={{ textTransform: 'capitalize' }}
                      >{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type} value={form[field]}
                    onChange={e =>
                      setForm(f => ({ ...f, [field]: e.target.value }))
                    }
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1px solid ${C.gray200}`,
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            ))}
            {form.type === 'weightlifting' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                  color: C.gray400, display: 'block', marginBottom: 4,
                }}>Intensity</label>
                <select
                  value={form.intensity}
                  onChange={e =>
                    setForm(f => ({ ...f, intensity: e.target.value }))
                  }
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${C.gray200}`,
                    fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                >
                  {['light', 'moderate', 'heavy'].map(i => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
            )}
            {['cycling', 'swimming'].includes(form.type) && (
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                  color: C.gray400, display: 'block', marginBottom: 4,
                }}>Distance (meters)</label>
                <input
                  type="number" value={form.distance_meters}
                  onChange={e =>
                    setForm(f => ({
                      ...f, distance_meters: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${C.gray200}`,
                    fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                color: C.gray400, display: 'block', marginBottom: 4,
              }}>Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e =>
                  setForm(f => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: `1px solid ${C.gray200}`,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  boxSizing: 'border-box', resize: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: `1px solid ${C.gray200}`,
                  background: C.gray50,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  fontWeight: 600, color: C.gray600, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleSave} disabled={saving}
                style={{
                  flex: 2, padding: '10px', borderRadius: 10,
                  border: 'none', background: C.navy,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  fontWeight: 700, color: C.white, cursor: 'pointer',
                }}
              >{saving ? 'Saving...' : 'Save Session'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
