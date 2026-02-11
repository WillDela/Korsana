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
    <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center p-6 sm:p-8">
      {/* Progress bar */}
      <div className="w-full max-w-[520px] mb-8">
        <div className="flex justify-between mb-2">
          {['Welcome', 'Connect', 'Goal', 'Ready'].map((label, i) => (
            <span
              key={label}
              className={`text-xs transition-colors ${
                i <= step
                  ? 'font-semibold text-navy'
                  : 'font-normal text-text-muted'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="h-1 bg-border-light rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-navy rounded-full"
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-[520px] min-h-[400px] relative">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="card p-8 sm:p-10 text-center"
            >
              <div className="text-3xl mb-4">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="inline-block w-14 h-14 bg-navy rounded-xl text-white font-bold text-xl flex items-center justify-center mx-auto"
                  style={{ display: 'inline-flex' }}
                >
                  K
                </motion.span>
              </div>
              <h1 className="text-2xl font-semibold text-navy mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Welcome to Korsana
              </h1>
              <p className="text-text-secondary leading-relaxed mb-8">
                Your AI-powered running coach. Connect your training data, set your race goal,
                and get personalized insights to help you cross the finish line.
              </p>
              <button onClick={goNext} className="btn btn-primary w-full py-3">
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
              className="card p-8 sm:p-10 text-center"
            >
              <h2 className="text-xl font-semibold text-text-primary mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Connect Your Data
              </h2>
              <p className="text-text-secondary mb-8">
                Link your Strava account to import your training history.
              </p>

              {stravaConnected ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-sage-light rounded-lg p-6 mb-8"
                >
                  <div className="text-2xl mb-2 text-success">&#10003;</div>
                  <p className="font-semibold text-text-primary">Strava Connected</p>
                </motion.div>
              ) : (
                <button
                  onClick={handleConnectStrava}
                  disabled={connectingStrava}
                  className="btn w-full py-3 mb-4 font-semibold text-white border-none"
                  style={{
                    background: '#FC4C02',
                    opacity: connectingStrava ? 0.7 : 1,
                  }}
                >
                  {connectingStrava ? 'Connecting...' : 'Connect Strava'}
                </button>
              )}

              <div className="flex gap-3">
                <button onClick={goBack} className="btn btn-ghost flex-1">
                  Back
                </button>
                <button onClick={goNext} className="btn btn-primary flex-[2]">
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
              className="card p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold text-text-primary mb-2 text-center" style={{ fontFamily: 'var(--font-heading)' }}>
                Set Your Race Goal
              </h2>
              <p className="text-text-secondary mb-6 text-center">
                What are you training for?
              </p>

              {error && (
                <div className="alert alert-error mb-4">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {/* Race name */}
                <div>
                  <label className="label block mb-1">Race Name</label>
                  <input
                    className="input w-full"
                    type="text"
                    placeholder="e.g. Miami Marathon"
                    value={raceName}
                    onChange={(e) => setRaceName(e.target.value)}
                  />
                </div>

                {/* Race date */}
                <div>
                  <label className="label block mb-1">Race Date</label>
                  <input
                    className="input w-full"
                    type="date"
                    value={raceDate}
                    onChange={(e) => setRaceDate(e.target.value)}
                  />
                </div>

                {/* Distance */}
                <div>
                  <label className="label block mb-2">Distance</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DISTANCES.map((d) => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => { setSelectedDistance(d.label); setCustomDistance(''); }}
                        className={`btn text-sm py-2 ${
                          selectedDistance === d.label
                            ? 'bg-navy text-white font-semibold border-navy'
                            : 'bg-bg-elevated text-text-primary border border-border'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input w-full mt-2"
                    type="number"
                    placeholder="Or enter custom distance (km)"
                    value={customDistance}
                    onChange={(e) => { setCustomDistance(e.target.value); setSelectedDistance(null); }}
                  />
                </div>

                {/* Goal type */}
                <div>
                  <label className="label block mb-2">Goal Type</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'time', label: 'Target Time' },
                      { value: 'finish', label: 'Just Finish' },
                      { value: 'pr', label: 'PR' },
                    ].map((gt) => (
                      <button
                        key={gt.value}
                        type="button"
                        onClick={() => setGoalType(gt.value)}
                        className={`btn flex-1 text-sm py-2 ${
                          goalType === gt.value
                            ? 'bg-navy text-white font-semibold border-navy'
                            : 'bg-bg-elevated text-text-primary border border-border'
                        }`}
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
                    <label className="label block mb-1">Target Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input className="input" type="number" placeholder="Hrs" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
                      <input className="input" type="number" placeholder="Min" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                      <input className="input" type="number" placeholder="Sec" min="0" max="59" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
                    </div>
                  </motion.div>
                )}

                {/* Live preview */}
                {raceName && raceDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-sage-light rounded-md px-4 py-3 text-sm text-center"
                  >
                    <strong>{raceName}</strong>
                    {weeksUntilRace() !== null && (
                      <span className="text-text-secondary">
                        {' '} &mdash; {weeksUntilRace()} weeks away
                      </span>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={goBack} className="btn btn-ghost flex-1">
                  Back
                </button>
                <button
                  onClick={handleCreateGoal}
                  disabled={submitting}
                  className="btn btn-primary flex-[2]"
                  style={{ opacity: submitting ? 0.7 : 1 }}
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
              className="card p-8 sm:p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center text-2xl mx-auto mb-6"
              >
                &#10003;
              </motion.div>
              <h2 className="text-xl font-semibold text-text-primary mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                You're All Set!
              </h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                Your dashboard is ready. Track your progress, check your metrics,
                and chat with your AI coach anytime.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary w-full py-3"
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
