import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { stravaAPI } from '../api/strava';
import { goalsAPI } from '../api/goals';

const DISTANCES = [
  { label: '5K', km: 5 },
  { label: '10K', km: 10 },
  { label: 'Half Marathon', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
];

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: (direction) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [connectingStrava, setConnectingStrava] = useState(false);

  // Goal form state
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [customDistance, setCustomDistance] = useState('');
  const [goalType, setGoalType] = useState('time');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleConnectStrava = async () => {
    try {
      setConnectingStrava(true);
      const response = await stravaAPI.getAuthURL();
      window.location.href = response.url;
    } catch (err) {
      console.error('Failed to start Strava auth:', err);
      setConnectingStrava(false);
    }
  };

  const handleCreateGoal = async () => {
    setError('');
    if (!raceName.trim()) { setError('Race name is required'); return; }
    if (!raceDate) { setError('Race date is required'); return; }

    const distanceKm = selectedDistance
      ? DISTANCES.find((d) => d.label === selectedDistance)?.km
      : parseFloat(customDistance);
    if (!distanceKm || distanceKm <= 0) { setError('Select or enter a valid distance'); return; }

    let targetTimeSeconds = null;
    if (goalType === 'time' || goalType === 'pr') {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      const s = parseInt(seconds) || 0;
      targetTimeSeconds = h * 3600 + m * 60 + s;
      if (targetTimeSeconds <= 0) { setError('Enter a valid target time'); return; }
    }

    try {
      setSubmitting(true);
      await goalsAPI.createGoal({
        race_name: raceName,
        race_date: raceDate,
        distance_km: distanceKm,
        goal_type: goalType,
        target_time_seconds: targetTimeSeconds,
      });
      goNext();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute countdown preview
  const daysUntilRace = () => {
    if (!raceDate) return null;
    const diff = new Date(raceDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const weeksUntilRace = () => {
    const days = daysUntilRace();
    return days !== null ? Math.floor(days / 7) : null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '520px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          {['Welcome', 'Connect', 'Goal', 'Ready'].map((label, i) => (
            <span
              key={label}
              style={{
                fontSize: '0.75rem',
                fontWeight: i <= step ? 600 : 400,
                color: i <= step ? 'var(--color-primary)' : 'var(--color-text-muted)',
                transition: 'color 0.3s',
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="progress-bar" style={{ height: '4px' }}>
          <motion.div
            className="progress-bar-fill"
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        minHeight: '400px',
        position: 'relative',
      }}>
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="card"
              style={{ padding: '2.5rem', textAlign: 'center' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  style={{ display: 'inline-block' }}
                >
                  K
                </motion.span>
              </div>
              <h1 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
                Welcome to Korsana
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                Your AI-powered running coach. Connect your training data, set your race goal,
                and get personalized insights to help you cross the finish line.
              </p>
              <button onClick={goNext} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                Get Started
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="connect"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="card"
              style={{ padding: '2.5rem', textAlign: 'center' }}
            >
              <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Connect Your Data
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                Link your Strava account to import your training history.
              </p>

              {stravaConnected ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    padding: '1.5rem',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-success)' }}>
                    ✓
                  </div>
                  <p style={{ fontWeight: 600 }}>Strava Connected</p>
                </motion.div>
              ) : (
                <button
                  onClick={handleConnectStrava}
                  disabled={connectingStrava}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#FC4C02',
                    color: '#fff',
                    border: 'none',
                    marginBottom: '1rem',
                    fontWeight: 600,
                    opacity: connectingStrava ? 0.7 : 1,
                  }}
                >
                  {connectingStrava ? 'Connecting...' : 'Connect Strava'}
                </button>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={goBack} className="btn btn-ghost" style={{ flex: 1 }}>
                  Back
                </button>
                <button onClick={goNext} className="btn btn-primary" style={{ flex: 2 }}>
                  {stravaConnected ? 'Continue' : 'Skip for now'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="goal"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="card"
              style={{ padding: '2rem' }}
            >
              <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
                Set Your Race Goal
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                What are you training for?
              </p>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Race name */}
                <div>
                  <label className="label" style={{ marginBottom: '0.25rem', display: 'block' }}>Race Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Miami Marathon"
                    value={raceName}
                    onChange={(e) => setRaceName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Race date */}
                <div>
                  <label className="label" style={{ marginBottom: '0.25rem', display: 'block' }}>Race Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={raceDate}
                    onChange={(e) => setRaceDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Distance */}
                <div>
                  <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>Distance</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {DISTANCES.map((d) => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => { setSelectedDistance(d.label); setCustomDistance(''); }}
                        className="btn"
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.8125rem',
                          background: selectedDistance === d.label ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                          color: selectedDistance === d.label ? '#fff' : 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                          fontWeight: selectedDistance === d.label ? 600 : 400,
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Or enter custom distance (km)"
                    value={customDistance}
                    onChange={(e) => { setCustomDistance(e.target.value); setSelectedDistance(null); }}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  />
                </div>

                {/* Goal type */}
                <div>
                  <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>Goal Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { value: 'time', label: 'Target Time' },
                      { value: 'finish', label: 'Just Finish' },
                      { value: 'pr', label: 'PR' },
                    ].map((gt) => (
                      <button
                        key={gt.value}
                        type="button"
                        onClick={() => setGoalType(gt.value)}
                        className="btn"
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          fontSize: '0.8125rem',
                          background: goalType === gt.value ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                          color: goalType === gt.value ? '#fff' : 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                          fontWeight: goalType === gt.value ? 600 : 400,
                        }}
                      >
                        {gt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target time (conditional) */}
                {(goalType === 'time' || goalType === 'pr') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="label" style={{ marginBottom: '0.25rem', display: 'block' }}>Target Time</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <input className="form-input" type="number" placeholder="Hrs" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
                      <input className="form-input" type="number" placeholder="Min" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                      <input className="form-input" type="number" placeholder="Sec" min="0" max="59" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
                    </div>
                  </motion.div>
                )}

                {/* Live preview */}
                {raceName && raceDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                    }}
                  >
                    <strong>{raceName}</strong>
                    {weeksUntilRace() !== null && (
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {' '} — {weeksUntilRace()} weeks away
                      </span>
                    )}
                  </motion.div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={goBack} className="btn btn-ghost" style={{ flex: 1 }}>
                  Back
                </button>
                <button
                  onClick={handleCreateGoal}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Creating...' : 'Set Goal'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="ready"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="card"
              style={{ padding: '2.5rem', textAlign: 'center' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  margin: '0 auto 1.5rem',
                }}
              >
                ✓
              </motion.div>
              <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                You're All Set!
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                Your dashboard is ready. Track your progress, check your metrics,
                and chat with your AI coach anytime.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.875rem' }}
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
