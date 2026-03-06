import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userProfileAPI } from '../../api/userProfile';
import { getErrorMessage } from '../../api/client';

const ZONE_COLORS = [
  'bg-[#e2e8f0]', // Z1 - Gray/Silver
  'bg-[#93c5fd]', // Z2 - Light Blue
  'bg-[#86efac]', // Z3 - Light Green
  'bg-[#fcd34d]', // Z4 - Yellow
  'bg-[#fca5a5]', // Z5 - Red
];

const parsePace = (str) => {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(str);
};

const formatPace = (seconds) => {
  if (seconds === 0 || !seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const TrainingZonesCard = ({ profileData, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('hr'); // 'hr' | 'pace'
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editZones, setEditZones] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchZones();
  }, [activeTab]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await userProfileAPI.getTrainingZones(activeTab);
      // Backend guarantees Z1-Z5 are sorted
      setZones(res.zones || []);
      setEditZones(res.zones || []);
    } catch (err) {
      console.error('Failed to fetch zones for', activeTab, err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (index, field, value) => {
    const updated = [...editZones];
    if (activeTab === 'pace') {
      // Input is MM:SS, store raw string or parse? We need to keep raw string while typing
      updated[index][field] = value;
    } else {
      updated[index][field] = value === '' ? null : parseInt(value, 10);
    }
    setEditZones(updated);
  };

  const handleSave = async () => {
    try {
      setError('');
      setLoading(true);

      const payload = editZones.map((z) => ({
        ...z,
        min_value: activeTab === 'pace' && typeof z.min_value === 'string' ? parsePace(z.min_value) : z.min_value,
        max_value: activeTab === 'pace' && typeof z.max_value === 'string' ? parsePace(z.max_value) : z.max_value,
      }));

      await userProfileAPI.updateTrainingZones(activeTab, payload);
      setEditing(false);
      await fetchZones(); // refresh formatting
      onUpdate && onUpdate();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Convert for display
  const displayZones = editing ? editZones : zones;

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-coral)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Training Zones</h2>
        </div>

        <div className="flex items-center bg-background rounded-lg p-1 border border-border">
          <button
            onClick={() => { setActiveTab('hr'); setEditing(false); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'hr' ? 'bg-white shadow-sm text-navy' : 'text-text-muted hover:text-text-secondary'
              }`}
          >
            Heart Rate
          </button>
          <button
            onClick={() => { setActiveTab('pace'); setEditing(false); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'pace' ? 'bg-white shadow-sm text-navy' : 'text-text-muted hover:text-text-secondary'
              }`}
          >
            Pace
          </button>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-end">
        <div>
          <p className="text-sm font-semibold text-text-primary capitalize">{activeTab} Zones</p>
          <p className="text-xs text-text-secondary mt-1 max-w-sm">
            {activeTab === 'hr'
              ? 'Calculated using the Karvonen formula with your resting and max heart rate.'
              : 'Pace zones calculated based on estimated threshold pace.'}
          </p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn btn-outline text-xs px-3 py-1.5 text-text-secondary hover:text-navy hover:border-navy transition-colors">
            Edit Zones
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setEditZones(zones); }} className="btn btn-outline text-xs px-3 py-1.5">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="btn btn-primary text-xs px-3 py-1.5">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="text-error text-sm mb-4">{error}</div>}

      <div className="flex flex-col gap-3">
        {loading && !editing && zones.length === 0 ? (
          <div className="h-40 animate-pulse bg-border-light rounded-xl" />
        ) : (
          displayZones.map((z, i) => {
            const minStr = activeTab === 'pace' ? (typeof z.min_value === 'string' ? z.min_value : formatPace(z.min_value)) : z.min_value;
            const maxStr = activeTab === 'pace' ? (typeof z.max_value === 'string' ? z.max_value : formatPace(z.max_value)) : z.max_value;

            // Just for visual bars, make them incrementally larger
            const barWidth = `${20 + (i * 20)}%`;

            return (
              <div key={z.id || i} className="group flex items-center gap-4 text-sm relative">
                <div className="w-10 font-bold text-navy shrink-0">Z{z.zone_number}</div>
                <div className="flex-1 border border-border bg-background-light rounded-lg overflow-hidden h-10 flex items-center relative">
                  {!editing && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: barWidth }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      className={`absolute top-0 left-0 bottom-0 opacity-40 ${ZONE_COLORS[i]}`}
                    />
                  )}

                  <div className="relative z-10 w-full flex items-center px-3 justify-between font-mono font-medium text-navy">
                    {editing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type={activeTab === 'pace' ? 'text' : 'number'}
                          className="w-20 bg-white border border-border rounded px-2 py-1 text-xs"
                          value={minStr || ''}
                          onChange={(e) => handleEditChange(i, 'min_value', e.target.value)}
                          placeholder={activeTab === 'pace' ? 'MM:SS' : 'Min'}
                        />
                        <span className="text-text-muted">-</span>
                        <input
                          type={activeTab === 'pace' ? 'text' : 'number'}
                          className="w-20 bg-white border border-border rounded px-2 py-1 text-xs"
                          value={maxStr || ''}
                          onChange={(e) => handleEditChange(i, 'max_value', e.target.value)}
                          placeholder={activeTab === 'pace' ? 'MM:SS' : 'Max'}
                        />
                      </div>
                    ) : (
                      <>
                        <span>{minStr || '0'}</span>
                        <span className="text-text-muted/50 mx-2">—</span>
                        <span>{maxStr ? maxStr : 'Max'}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-24 text-right text-xs text-text-secondary font-medium tracking-wide shrink-0 hidden md:block uppercase">
                  {z.label}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TrainingZonesCard;
