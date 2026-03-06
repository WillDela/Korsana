import { useState } from 'react';
import { motion } from 'framer-motion';
import { userProfileAPI } from '../../api/userProfile';

const ToggleSwitch = ({ isOn, onToggle, label, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0 hover:bg-background-light/50 px-2 rounded-lg transition-colors">
    <div>
      <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
      <p className="text-xs text-text-secondary mt-0.5">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${isOn ? 'bg-navy' : 'bg-border'
        }`}
    >
      <motion.div
        layout
        className="absolute top-1 bottom-1 w-4 rounded-full bg-white shadow-sm"
        initial={false}
        animate={{
          left: isOn ? 'calc(100% - 1.25rem)' : '0.25rem',
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

const NotificationsCard = ({ profileData, onUpdate }) => {
  const [prefs, setPrefs] = useState({
    notify_weekly_summary: profileData?.profile?.notify_weekly_summary ?? true,
    notify_goal_reminders: profileData?.profile?.notify_goal_reminders ?? true,
    notify_sync_failures: profileData?.profile?.notify_sync_failures ?? true,
  });

  const handleToggle = async (field) => {
    const newVal = !prefs[field];
    const newPrefs = { ...prefs, [field]: newVal };
    setPrefs(newPrefs);

    try {
      await userProfileAPI.updateProfile({ [field]: newVal });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update notification pref:', field);
      setPrefs({ ...prefs, [field]: !newVal }); // revert
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4 px-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Notification Settings</h2>
      </div>

      <div className="flex flex-col">
        <ToggleSwitch
          isOn={prefs.notify_weekly_summary}
          onToggle={() => handleToggle('notify_weekly_summary')}
          label="Weekly Training Summary"
          description="Receive a weekly recap of your stats and progress."
        />
        <ToggleSwitch
          isOn={prefs.notify_goal_reminders}
          onToggle={() => handleToggle('notify_goal_reminders')}
          label="Race & Goal Reminders"
          description="Alerts when a race deadline or goal target is approaching."
        />
        <ToggleSwitch
          isOn={prefs.notify_sync_failures}
          onToggle={() => handleToggle('notify_sync_failures')}
          label="Sync Errors"
          description="Get notified if a Strava or device sync fails."
        />
      </div>
    </div>
  );
};

export default NotificationsCard;
