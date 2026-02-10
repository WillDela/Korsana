import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import WeekCalendar from '../components/WeekCalendar';

const Calendar = () => {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <Navbar variant="dashboard" />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <h1
            className="font-serif"
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1F2937',
              margin: '0 0 0.25rem',
            }}
          >
            Training Calendar
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
            Plan your workouts and track completion
          </p>
        </motion.div>

        {/* Calendar card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '1.5rem',
            position: 'relative',
          }}
        >
          <WeekCalendar compact={false} />
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            gap: '1.25rem',
            marginTop: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {[
            { color: '#E5E7EB', label: 'Planned', border: true },
            { color: '#10B981', label: 'Completed', border: false },
            { color: '#DC2626', label: 'Missed', border: false },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.border ? 'transparent' : item.color,
                  border: item.border ? `2px solid ${item.color}` : 'none',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default Calendar;
