import { useState } from 'react';
import { predictorAPI } from '../../../api/dashboard';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray200: "#D4D8E8", gray400: "#8B93B0",
  gray600: "#4A5173", white: "#FFFFFF", green: "#2ECC8B",
  amber: "#F5A623",
};

function fmtTime(secs) {
  if (!secs) return '--:--:--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.round(secs % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RacePredictorWidget({ data, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editDist, setEditDist] = useState('10K');
  const [editH, setEditH] = useState('0');
  const [editM, setEditM] = useState('45');
  const [editS, setEditS] = useState('00');
  const [editDate, setEditDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

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
          }}>Race Predictor</span>
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
          }}>Sync runs to see race predictions</div>
        </div>
      </div>
    );
  }

  const marathon = data.predictions?.find(p => p.label === 'Marathon');
  const goalSecs = data.goal_seconds;

  const handleSave = async () => {
    setSaving(true);
    try {
      const totalSecs =
        parseInt(editH) * 3600 +
        parseInt(editM) * 60 +
        parseInt(editS);
      await predictorAPI.saveManual({
        distance_label: editDist === 'Half Marathon'
          ? 'half_marathon'
          : editDist.toLowerCase().replace(' ', ''),
        time_seconds: totalSecs,
        date_recorded: editDate,
      });
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

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
        }}>Race Predictor</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr',
        gap: 20, alignItems: 'start',
      }}>
        <div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10,
            color: C.gray400, marginBottom: 4,
          }}>Based on</div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 14,
            fontWeight: 700, color: C.navy,
          }}>{data.source_distance}</div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 12,
            color: C.gray600, marginTop: 2,
          }}>{fmtTime(data.source_time_seconds)}</div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              marginTop: 10, background: 'none', border: 'none',
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              color: C.coral, cursor: 'pointer', padding: 0,
              fontWeight: 600,
            }}
          >Edit →</button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10,
            color: C.gray400, marginBottom: 4,
          }}>Marathon Prediction</div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 48,
            fontWeight: 700, color: C.navy, lineHeight: 1,
          }}>{fmtTime(marathon?.seconds)}</div>
          {marathon && (
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 10,
              color: C.gray400, marginTop: 4,
            }}>
              {fmtTime(marathon.low)} – {fmtTime(marathon.high)}
            </div>
          )}
          {goalSecs && marathon && (
            <div style={{
              marginTop: 8, fontFamily: 'DM Sans, sans-serif',
              fontSize: 11, fontWeight: 600,
              color: marathon.seconds <= goalSecs ? C.green : C.coral,
            }}>
              {marathon.seconds <= goalSecs
                ? '✓ On track for goal'
                : `${fmtTime(marathon.seconds - goalSecs)} behind goal`}
            </div>
          )}
        </div>
        <div>
          {(data.predictions || []).map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '7px 0',
              borderBottom: i < data.predictions.length - 1
                ? `1px solid ${C.gray100}` : 'none',
              background: p.label === 'Marathon'
                ? C.gray50 : 'transparent',
              borderRadius: p.label === 'Marathon' ? 6 : 0,
              paddingLeft: p.label === 'Marathon' ? 6 : 0,
            }}>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                color: C.gray600,
              }}>{p.label}</span>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 12,
                fontWeight: 700, color: C.navy,
              }}>{fmtTime(p.seconds)}</span>
            </div>
          ))}
        </div>
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
            width: 360,
            boxShadow: '0 8px 40px rgba(27,37,89,0.2)',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 14,
              fontWeight: 700, color: C.navy, marginBottom: 20,
            }}>Set Race Time</div>
            <label style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              color: C.gray400, display: 'block', marginBottom: 4,
            }}>Distance</label>
            <select
              value={editDist}
              onChange={e => setEditDist(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${C.gray200}`,
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                marginBottom: 14,
              }}
            >
              {['5K', '10K', 'Half Marathon', 'Marathon'].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <label style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              color: C.gray400, display: 'block', marginBottom: 4,
            }}>Time (H:MM:SS)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                type="number" min="0" max="9" value={editH}
                onChange={e => setEditH(e.target.value)}
                style={{
                  width: '33%', padding: '8px', borderRadius: 8,
                  border: `1px solid ${C.gray200}`,
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 14,
                  textAlign: 'center',
                }}
                placeholder="H"
              />
              <input
                type="number" min="0" max="59" value={editM}
                onChange={e => setEditM(e.target.value)}
                style={{
                  width: '33%', padding: '8px', borderRadius: 8,
                  border: `1px solid ${C.gray200}`,
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 14,
                  textAlign: 'center',
                }}
                placeholder="MM"
              />
              <input
                type="number" min="0" max="59" value={editS}
                onChange={e => setEditS(e.target.value)}
                style={{
                  width: '33%', padding: '8px', borderRadius: 8,
                  border: `1px solid ${C.gray200}`,
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 14,
                  textAlign: 'center',
                }}
                placeholder="SS"
              />
            </div>
            <label style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 11,
              color: C.gray400, display: 'block', marginBottom: 4,
            }}>Date Recorded</label>
            <input
              type="date" value={editDate}
              onChange={e => setEditDate(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${C.gray200}`,
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                marginBottom: 20, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: `1px solid ${C.gray200}`, background: C.gray50,
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
              >{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
