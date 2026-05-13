import { useMemo, useState } from 'react';
import { userProfileAPI } from '../../api/userProfile';
import { detectBrowserTimezone } from '../../hooks/useTimezoneSync';

// Fallback list for browsers without Intl.supportedValuesOf (older Safari).
// Common zones spanning every continent so users can still pick something
// reasonable; full list is preferred when available.
const FALLBACK_ZONES = [
  'UTC',
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Halifax',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Sao_Paulo',
  'America/Toronto',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Melbourne',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Rome',
  'Pacific/Auckland',
];

const getSupportedZones = () => {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone');
    }
  } catch {
    // fall through
  }
  return FALLBACK_ZONES;
};

const TimezoneCard = ({ profileData, onUpdate }) => {
  const stored = profileData?.profile?.timezone || 'UTC';
  const detected = useMemo(() => detectBrowserTimezone(), []);
  const zones = useMemo(getSupportedZones, []);
  const [value, setValue] = useState(stored);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // The browser might report a zone that's not in our list (e.g. an alias).
  // Show it as an extra option so the current value is always selectable.
  const options = useMemo(() => {
    const set = new Set(zones);
    if (stored) set.add(stored);
    if (detected) set.add(detected);
    return Array.from(set).sort();
  }, [zones, stored, detected]);

  const persist = async (tz) => {
    if (tz === stored) return;
    setError('');
    setSaving(true);
    try {
      await userProfileAPI.updateProfile({ timezone: tz });
      if (onUpdate) onUpdate();
    } catch (err) {
      setValue(stored);
      const message = err?.response?.data?.error || 'Failed to update timezone';
      setError(message);
      console.error('Failed to update timezone:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (e) => {
    const next = e.target.value;
    setValue(next);
    persist(next);
  };

  const handleUseDetected = () => {
    setValue(detected);
    persist(detected);
  };

  const mismatch = detected && detected !== stored;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Timezone</h2>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Used to bucket Strava activities and calendar dates so they appear on the day you actually ran.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="timezone-select" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Your timezone
          </label>
          <select
            id="timezone-select"
            value={value}
            onChange={handleSelect}
            disabled={saving}
            className="w-full sm:w-96 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/40"
          >
            {options.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <span>
            Detected from this browser: <span className="font-mono text-text-primary">{detected}</span>
          </span>
          {mismatch && (
            <button
              type="button"
              onClick={handleUseDetected}
              disabled={saving}
              className="text-navy font-semibold hover:underline disabled:opacity-50"
            >
              Use detected
            </button>
          )}
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    </div>
  );
};

export default TimezoneCard;
