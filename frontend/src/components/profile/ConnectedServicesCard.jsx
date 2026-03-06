import { motion } from 'framer-motion';
import BrandIcon from '../BrandIcon';

const ConnectedServicesCard = ({ stravaConnected, stravaAthleteId, stravaMessage, onConnectStrava }) => {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Connected Services</h2>
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

      {stravaConnected ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="badge badge-success text-sm">Connected</span>
            <span className="text-sm text-text-muted">
              Athlete ID: {stravaAthleteId}
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your Strava account is connected. Activities are synced automatically when you visit the dashboard.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            Connect your accounts to sync your running activities and get personalized coaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="btn text-sm font-semibold text-white border-none flex-1 flex items-center justify-center gap-2"
              onClick={onConnectStrava}
              style={{ background: 'var(--color-strava)' }}
            >
              <BrandIcon brand="strava" size={16} />
              Connect Strava
            </button>
            <button
              className="btn text-sm font-semibold text-white border-none flex-1 opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              disabled
              style={{ background: 'var(--color-garmin)' }}
            >
              <BrandIcon brand="garmin" size={16} />
              Garmin (Soon)
            </button>
            <button
              className="btn text-sm font-semibold text-white border-none flex-1 opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              disabled
              style={{ background: 'var(--color-coros)' }}
            >
              <BrandIcon brand="coros" size={16} />
              Coros (Soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectedServicesCard;
