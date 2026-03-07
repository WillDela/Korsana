import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userProfileAPI } from '../../api/userProfile';
import { getErrorMessage } from '../../api/client';
import BrandIcon from '../BrandIcon';

const PREDEFINED_LABELS = ['5K', '10K', 'Half Marathon', 'Marathon'];

const formatTime = (seconds) => {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const parseTimeToSeconds = (timeStr) => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

const AnimatedDigit = ({ value }) => {
  // A simple spring-based counter could be implemented here
  // For simplicity and stability, we just render the formatted string
  return <span>{value}</span>;
};

const PersonalRecords = ({ profileData, onUpdate }) => {
  const [detecting, setDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [editingLabel, setEditingLabel] = useState(null);
  const [editTime, setEditTime] = useState('');
  const [saveError, setSaveError] = useState('');

  const prs = profileData?.personal_records || [];
  const stravaConnected = profileData?.strava?.connected;

  const handleDetect = async () => {
    try {
      setDetecting(true);
      setDetectionMessage('');
      const res = await userProfileAPI.detectPRsFromStrava();
      setDetectionMessage(res.message || `Detected ${res.detected_count} new PRs!`);
      if (res.detected_count > 0) {
        await onUpdate();
      }
      setTimeout(() => setDetectionMessage(''), 3000);
    } catch (err) {
      setDetectionMessage(getErrorMessage(err));
    } finally {
      setDetecting(false);
    }
  };

  const handleEditSave = async (label) => {
    try {
      let seconds = parseTimeToSeconds(editTime);
      if (seconds > 0) {
        await userProfileAPI.upsertPersonalRecord(label, { time_seconds: seconds, source: 'manual' });
        await onUpdate();
      }
    } catch (err) {
      setSaveError(getErrorMessage(err));
    }
    setEditingLabel(null);
  };

  const currentRecords = PREDEFINED_LABELS.map(label => {
    const existing = prs.find(p => p.label === label);
    return {
      label,
      time_seconds: existing ? existing.time_seconds : null,
      source: existing ? existing.source : null
    };
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Personal Records</h2>
        </div>

        {stravaConnected && (
          <div className="flex items-center gap-3">
            {detectionMessage && (
              <span className="text-xs text-sage font-medium">{detectionMessage}</span>
            )}
            <button
              onClick={handleDetect}
              disabled={detecting}
              className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-2"
            >
              <BrandIcon brand="strava" size={14} />
              {detecting ? 'Scanning...' : 'Detect via Strava'}
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <p className="text-sm text-coral mb-4">{saveError}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentRecords.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl border border-border bg-background-light relative group hover:border-navy/30 transition-colors"
          >
            <div className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
              {r.label}
            </div>

            {editingLabel === r.label ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  type="text"
                  className="input py-1 px-2 text-sm w-full font-mono font-bold text-navy"
                  placeholder="HH:MM:SS"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave(r.label);
                    if (e.key === 'Escape') setEditingLabel(null);
                  }}
                  onBlur={() => handleEditSave(r.label)}
                />
              </div>
            ) : (
              <div className="flex items-end justify-between">
                <div className={`text-2xl font-bold font-mono tracking-tight ${r.time_seconds ? 'text-navy' : 'text-text-muted/40'}`}>
                  <AnimatedDigit value={formatTime(r.time_seconds)} />
                </div>

                <button
                  onClick={() => {
                    setEditingLabel(r.label);
                    setEditTime(r.time_seconds ? formatTime(r.time_seconds) : '');
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-navy"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              </div>
            )}

            {r.source === 'strava' && !editingLabel && (
              <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-100 transition-opacity">
                <BrandIcon brand="strava" size={12} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PersonalRecords;
