import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { stravaAPI } from '../../api/strava';
import BrandIcon from '../BrandIcon';

const ConnectedServicesCard = ({ stravaConnected, stravaAthleteId, stravaMessage, onConnectStrava, onDisconnect, onUpdate }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await stravaAPI.syncActivities();
      setSyncMessage(`Synced ${res.count} activities successfully!`);
      if (onUpdate) onUpdate();
    } catch (err) {
      setSyncMessage('Failed to sync. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  };

  const handleDisconnect = async () => {
    try {
      await stravaAPI.disconnect();
      if (onDisconnect) onDisconnect();
    } catch (err) {
      alert('Failed to disconnect Strava.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <BrandIcon brand="strava" size={24} />
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Strava Integration</h2>
        </div>

        {stravaMessage?.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium text-white ${stravaMessage.type === 'success' ? 'bg-success' : 'bg-error'
              }`}
          >
            {stravaMessage.text}
          </motion.div>
        )}

        <AnimatePresence>
          {syncMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg px-4 py-3 mb-4 text-sm font-medium text-navy bg-sage/20 border border-sage/40"
            >
              {syncMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {stravaConnected ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="badge badge-success text-sm">Connected</span>
              <span className="text-sm text-text-muted">
                Athlete ID: {stravaAthleteId}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Your Strava account is connected. Activities are synced automatically when you visit the dashboard, or you can force a sync below.
            </p>
            <div className="flex gap-4">
              <button
                className="btn btn-outline text-sm font-semibold flex items-center justify-center gap-2"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? (
                  <span className="animate-spin h-4 w-4 border-2 border-navy border-t-transparent rounded-full" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                )}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                className="btn text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-error border-none transition-colors"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Connect Strava to automatically sync your running activities and get personalized coaching based on your true efforts.
            </p>
            <button
              className="btn text-sm font-semibold text-white border-none flex items-center justify-center gap-2"
              onClick={onConnectStrava}
              style={{ background: 'var(--color-strava)' }}
            >
              <BrandIcon brand="strava" size={16} />
              Connect Strava
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card opacity-60 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[0.65rem] font-bold tracking-wider uppercase text-text-secondary bg-border-light px-2 py-1 rounded">Soon</div>
          <div className="flex items-center gap-2 mb-2 mt-2">
            <BrandIcon brand="garmin" size={20} />
            <h3 className="font-semibold text-text-primary">Garmin Connect</h3>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Sync your Garmin watch runs and advanced running dynamics directly to Korsana.
          </p>
        </div>

        <div className="card opacity-60 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[0.65rem] font-bold tracking-wider uppercase text-text-secondary bg-border-light px-2 py-1 rounded">Soon</div>
          <div className="flex items-center gap-2 mb-2 mt-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.111 8.89h-1.667v4.444h-1.666v-4.444H10.11v-1.667h1.667V7.556H13.44v1.667h1.667v1.667z" /></svg>
            <h3 className="font-semibold text-text-primary">Apple Health</h3>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Read workout data seamlessly from your Apple Watch via HealthKit.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectedServicesCard;
