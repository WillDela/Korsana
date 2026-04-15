import { useState, useEffect } from 'react';
import { userProfileAPI } from '../../api/userProfile';
import { useUnits } from '../../context/UnitsContext';

const UnitsPreferenceCard = ({ profileData, onUpdate }) => {
  const { unit, updateUnit } = useUnits();
  const initialPref = profileData?.profile?.units_preference || 'imperial';
  const [pref, setPref] = useState(initialPref);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const serverPref = profileData?.profile?.units_preference;
    if (serverPref && serverPref !== unit) updateUnit(serverPref);
  }, [profileData?.profile?.units_preference]);

  const handleToggle = async (val) => {
    if (val === pref) return;
    setPref(val);
    updateUnit(val);
    try {
      setSaving(true);
      await userProfileAPI.updateProfile({ units_preference: val });
      if (onUpdate) onUpdate();
    } catch (err) {
      setPref(initialPref);
      updateUnit(initialPref);
      console.error('Failed to save preferred units:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="M8 17l4 4 4-4" />
        </svg>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Regional Units</h2>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Choose your preferred measurement system for distances and pace.
      </p>

      <div className="flex items-center bg-background rounded-lg p-1 border border-border w-max">
        <button
          onClick={() => handleToggle('metric')}
          disabled={saving}
          className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${pref === 'metric' ? 'bg-white shadow-sm text-navy' : 'text-text-muted hover:text-text-secondary'
            }`}
        >
          Metric (km)
        </button>
        <button
          onClick={() => handleToggle('imperial')}
          disabled={saving}
          className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${pref === 'imperial' ? 'bg-white shadow-sm text-navy' : 'text-text-muted hover:text-text-secondary'
            }`}
        >
          Imperial (mi)
        </button>
      </div>
    </div>
  );
};

export default UnitsPreferenceCard;
