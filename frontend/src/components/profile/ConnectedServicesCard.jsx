import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuRefreshCw, LuUnlink, LuShieldCheck, LuBell } from 'react-icons/lu';
import { stravaAPI } from '../../api/strava';
import BrandIcon from '../BrandIcon';
import StatusBadge from '../ui/StatusBadge';

// ── Disconnect confirmation modal ─────────────────────────────────────────────

const DisconnectModal = ({ onConfirm, onCancel, loading }) => (
  <div
    style={{ position: 'fixed', inset: 0, background: 'rgba(27,37,89,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={onCancel}
  >
    <div
      style={{ background: '#fff', borderRadius: 20, width: 440, padding: '28px 32px', boxShadow: '0 20px 60px rgba(27,37,89,0.25)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Disconnect Strava?
      </h2>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        Your Strava activities will no longer sync. Existing activity data already imported into Korsana will not be removed.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="btn btn-sm btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="btn btn-sm text-white border-none"
          style={{ background: 'var(--color-danger)' }}
        >
          {loading ? 'Disconnecting…' : 'Yes, Disconnect'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const ConnectedServicesCard = ({
  stravaConnected,
  stravaAthleteId,
  stravaMessage,
  onConnectStrava,
  onDisconnect,
  onUpdate,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState('');

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      setSyncError('');
      const res = await stravaAPI.syncActivities();
      setSyncMessage(res?.message || `Synced ${res.count} activities.`);
      if (onUpdate) onUpdate();
    } catch {
      setSyncError('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => { setSyncMessage(''); setSyncError(''); }, 5000);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      setDisconnectError('');
      await stravaAPI.disconnect();
      setConfirmDisconnect(false);
      if (onDisconnect) onDisconnect();
    } catch {
      setDisconnectError('Failed to disconnect. Please try again.');
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Strava card ───────────────────────────────────────── */}
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <BrandIcon brand="strava" size={24} />
            <div>
              <h2 className="text-base font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                Strava
              </h2>
              <p className="text-xs text-text-muted">Running & activity tracking</p>
            </div>
          </div>
          <StatusBadge
            label={stravaConnected ? 'Connected' : 'Not connected'}
            variant={stravaConnected ? 'success' : 'neutral'}
            size="sm"
            dot
          />
        </div>

        {/* Flash messages */}
        <AnimatePresence>
          {stravaMessage?.text && (
            <motion.div
              key="strava-msg"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium text-white ${stravaMessage.type === 'success' ? 'bg-success' : 'bg-error'}`}
            >
              {stravaMessage.text}
            </motion.div>
          )}
          {syncMessage && (
            <motion.div
              key="sync-msg"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg px-4 py-3 mb-4 text-sm font-medium text-navy bg-sage/10 border border-sage/30"
            >
              {syncMessage}
            </motion.div>
          )}
          {(syncError || disconnectError) && (
            <motion.div
              key="error-msg"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg px-4 py-3 mb-4 text-sm font-medium text-white bg-error"
            >
              {syncError || disconnectError}
            </motion.div>
          )}
        </AnimatePresence>

        {stravaConnected ? (
          <div>
            {/* Connection details */}
            <div className="bg-[var(--navy-tint)] rounded-xl p-4 mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <LuShieldCheck size={14} className="text-success shrink-0" />
                  <span>Read-only access to activities</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Athlete ID</span>
                <span className="text-xs font-mono text-text-secondary">#{stravaAthleteId}</span>
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              Activities sync automatically when you open the Dashboard. Use the button below to pull in the latest runs on demand.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="btn btn-sm btn-outline font-semibold flex items-center gap-2"
              >
                <LuRefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
              <button
                onClick={() => setConfirmDisconnect(true)}
                className="btn btn-sm font-semibold text-text-secondary bg-border-light hover:text-error hover:bg-error/10 border-none transition-colors flex items-center gap-2"
              >
                <LuUnlink size={14} />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              Connect Strava to automatically sync your running activities and unlock personalized coaching based on your real training data.
            </p>
            <button
              onClick={onConnectStrava}
              className="btn btn-sm font-semibold text-white border-none flex items-center gap-2"
              style={{ background: 'var(--color-strava)' }}
            >
              <BrandIcon brand="strava" size={15} />
              Connect Strava
            </button>
          </div>
        )}
      </div>

      {/* ── Coming soon integrations ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            brand: 'garmin',
            name: 'Garmin Connect',
            desc: 'Sync your Garmin watch runs and advanced running dynamics directly to Korsana.',
          },
          {
            brand: null,
            name: 'Coros',
            desc: 'Import GPS and heart rate data from your Coros pace watch.',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-text-muted">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ),
          },
        ].map(({ brand, name, desc, icon }) => (
          <div key={name} className="card border-dashed border-border opacity-70 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted bg-border-light px-2 py-1 rounded">
                Coming soon
              </span>
            </div>
            <div className="flex items-center gap-2.5 mb-3 mt-1">
              {brand ? <BrandIcon brand={brand} size={20} /> : icon}
              <h3 className="font-semibold text-sm text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                {name}
              </h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-4">{desc}</p>
            <button
              disabled
              className="btn btn-sm border border-border text-text-muted bg-transparent cursor-not-allowed flex items-center gap-1.5 text-xs"
            >
              <LuBell size={12} />
              Notify me
            </button>
          </div>
        ))}
      </div>

      {/* Disconnect confirmation modal */}
      {confirmDisconnect && (
        <DisconnectModal
          onConfirm={handleDisconnect}
          onCancel={() => { setConfirmDisconnect(false); setDisconnectError(''); }}
          loading={disconnecting}
        />
      )}
    </div>
  );
};

export default ConnectedServicesCard;
