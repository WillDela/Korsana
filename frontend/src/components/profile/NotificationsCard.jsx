import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { userProfileAPI } from '../../api/userProfile';
import { getErrorMessage } from '../../api/client';

const NOTIFICATION_TESTS = [
  {
    key: 'weekly_summary',
    label: 'Weekly Summary',
    description: 'Preview the weekly training recap email.',
  },
  {
    key: 'goal_reminder',
    label: 'Goal Reminder',
    description: 'Preview a race milestone reminder email.',
  },
  {
    key: 'sync_failure',
    label: 'Sync Alert',
    description: 'Preview the email sent after a failed sync.',
  },
];

const ToggleSwitch = ({ isOn, onToggle, label, description, disabled }) => (
  <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0 hover:bg-background-light/50 px-2 rounded-lg transition-colors">
    <div>
      <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
      <p className="text-xs text-text-secondary mt-0.5">{description}</p>
    </div>
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${isOn ? 'bg-navy' : 'bg-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        layout
        className="absolute top-1 bottom-1 w-4 rounded-full bg-white shadow-sm"
        initial={false}
        animate={{
          left: isOn ? 'calc(100% - 1.25rem)' : '0.25rem',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

const formatDeliveryLabel = (delivery) => {
  const subject = delivery?.subject?.trim();
  if (subject) return subject;
  return delivery?.notification_type?.replaceAll('_', ' ') || 'Notification';
};

const formatDeliveryMeta = (delivery) => {
  const createdAt = delivery?.created_at
    ? new Date(delivery.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Just now';
  return `${delivery?.status || 'unknown'} • ${createdAt}`;
};

const NotificationsCard = ({ profileData, onUpdate }) => {
  const [prefs, setPrefs] = useState({
    notify_weekly_summary: profileData?.profile?.notify_weekly_summary ?? true,
    notify_goal_reminders: profileData?.profile?.notify_goal_reminders ?? true,
    notify_sync_failures: profileData?.profile?.notify_sync_failures ?? true,
  });
  const [saving, setSaving] = useState({
    notify_weekly_summary: false,
    notify_goal_reminders: false,
    notify_sync_failures: false,
  });
  const [sendingType, setSendingType] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    setPrefs({
      notify_weekly_summary: profileData?.profile?.notify_weekly_summary ?? true,
      notify_goal_reminders: profileData?.profile?.notify_goal_reminders ?? true,
      notify_sync_failures: profileData?.profile?.notify_sync_failures ?? true,
    });
  }, [profileData]);

  const emailEnabled = Boolean(profileData?.notifications?.email_enabled);
  const recentDeliveries = profileData?.notifications?.recent_deliveries || [];

  const handleToggle = async (field) => {
    const newVal = !prefs[field];
    setPrefs((prev) => ({ ...prev, [field]: newVal }));
    setSaving((prev) => ({ ...prev, [field]: true }));
    setFeedback({ type: '', text: '' });

    try {
      await userProfileAPI.updateProfile({ [field]: newVal });
      if (onUpdate) await onUpdate();
    } catch (err) {
      setPrefs((prev) => ({ ...prev, [field]: !newVal }));
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSendTest = async (type) => {
    setSendingType(type);
    setFeedback({ type: '', text: '' });

    try {
      const response = await userProfileAPI.sendTestNotification(type);
      setFeedback({ type: 'success', text: response?.message || 'Test notification sent.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSendingType('');
      if (onUpdate) await onUpdate();
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4 px-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Notification Settings</h2>
      </div>

      <div className={`flex items-start gap-2 mb-5 px-3 py-3 rounded-lg text-sm border ${emailEnabled ? 'bg-sage/10 border-sage/30 text-text-secondary' : 'bg-amber/10 border-amber/30 text-text-secondary'}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 mt-0.5 ${emailEnabled ? 'text-success' : 'text-amber'}`}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          {emailEnabled
            ? 'Email delivery is configured for this environment. Use the preview buttons below to verify each notification type.'
            : 'Preferences are saved, but outbound email is not configured in this environment yet. Test sends will record the skipped delivery so you can still verify the pipeline.'}
        </span>
      </div>

      {feedback.text && (
        <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-sage/10 border border-sage/30 text-navy' : 'bg-error text-white'}`}>
          {feedback.text}
        </div>
      )}

      <div className="flex flex-col mb-6">
        <ToggleSwitch
          isOn={prefs.notify_weekly_summary}
          onToggle={() => handleToggle('notify_weekly_summary')}
          label="Weekly Training Summary"
          description="Receive a weekly recap of your stats and progress."
          disabled={saving.notify_weekly_summary}
        />
        <ToggleSwitch
          isOn={prefs.notify_goal_reminders}
          onToggle={() => handleToggle('notify_goal_reminders')}
          label="Race & Goal Reminders"
          description="Alerts when a race deadline or goal target is approaching."
          disabled={saving.notify_goal_reminders}
        />
        <ToggleSwitch
          isOn={prefs.notify_sync_failures}
          onToggle={() => handleToggle('notify_sync_failures')}
          label="Sync Errors"
          description="Get notified if a Strava or device sync fails."
          disabled={saving.notify_sync_failures}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-background-light/60 p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Preview Notifications</h3>
          <p className="text-xs text-text-secondary mb-4">Send a real test through the backend delivery pipeline.</p>
          <div className="space-y-3">
            {NOTIFICATION_TESTS.map((item) => (
              <div key={item.key} className="rounded-xl border border-border/70 bg-white/80 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-secondary mt-1">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleSendTest(item.key)}
                    disabled={sendingType === item.key}
                    className="btn btn-sm btn-outline shrink-0"
                  >
                    {sendingType === item.key ? 'Sending…' : 'Send test'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background-light/60 p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Recent Delivery Activity</h3>
          <p className="text-xs text-text-secondary mb-4">The last few notification attempts recorded for this account.</p>
          {recentDeliveries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-text-muted">
              No delivery activity yet. Send a preview to populate this feed.
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="rounded-xl border border-border/70 bg-white/80 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{formatDeliveryLabel(delivery)}</p>
                      <p className="text-xs text-text-secondary mt-1">{formatDeliveryMeta(delivery)}</p>
                      {delivery.error_message && (
                        <p className="text-xs text-error mt-2">{delivery.error_message}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${delivery.status === 'sent' ? 'bg-sage/15 text-sage' : delivery.status === 'failed' ? 'bg-error/10 text-error' : 'bg-amber/15 text-amber'}`}>
                      {delivery.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsCard;
