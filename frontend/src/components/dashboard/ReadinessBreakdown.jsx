import { motion, AnimatePresence } from 'framer-motion';

const LABELS = ['Volume', 'Pace', 'Consistency', 'Long Run', 'Trend'];
const KEYS = ['volume', 'pace', 'consistency', 'longRun', 'trend'];

const getBarColor = (value) => {
  if (value >= 70) return 'var(--color-sage)';
  if (value >= 40) return 'var(--color-amber)';
  return 'var(--color-coral)';
};

const ReadinessBreakdown = ({ scores = {}, expanded, onToggle }) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted cursor-pointer bg-transparent border-none hover:text-navy transition-colors"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Readiness Breakdown
        <svg
          className="w-3.5 h-3.5 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {KEYS.map((key, i) => {
                const value = Math.round(scores[key] ?? 0);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-secondary">
                        {LABELS[i]}
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ fontFamily: 'var(--font-mono)', color: getBarColor(value) }}
                      >
                        {value}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border-light overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getBarColor(value) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReadinessBreakdown;
