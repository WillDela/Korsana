import { motion } from 'framer-motion';
import WeekCalendar from '../components/WeekCalendar';

const Calendar = () => {
  return (
    <>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-text-primary mb-1">Training Calendar</h1>
        <p className="text-sm text-text-secondary">Plan your workouts and track completion</p>
      </motion.div>

      {/* Calendar card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white border border-border rounded-xl p-6"
      >
        <WeekCalendar compact={false} />
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-5 mt-4 justify-center flex-wrap"
      >
        {[
          { color: '#E1E4ED', label: 'Planned', border: true },
          { color: '#2E8B57', label: 'Completed', border: false },
          { color: '#D94343', label: 'Missed', border: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: item.border ? 'transparent' : item.color,
                border: item.border ? `2px solid ${item.color}` : 'none',
              }}
            />
            <span className="text-xs text-text-muted">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </>
  );
};

export default Calendar;
