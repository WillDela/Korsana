import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCheck, LuArrowRight, LuFlag, LuCalendar, LuZap } from 'react-icons/lu';
import { stravaAPI } from '../api/strava';
import { goalsAPI } from '../api/goals';
import { userProfileAPI } from '../api/userProfile';
import BrandIcon from '../components/BrandIcon';

const DISTANCES = [
  { label: '5K', km: 5 },
  { label: '10K', km: 10 },
  { label: 'Half Marathon', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
];

const STEPS = [
  {
    title: 'Welcome to Korsana',
    context: 'Race-focused AI coaching built around your actual training data.',
  },
  {
    title: 'Connect your training data',
    context: 'Korsana reads your Strava history to give grounded advice — not generic plans.',
  },
  {
    title: 'Set your race goal',
    context: 'This anchors everything: your training calendar, finish predictor, and daily coaching briefing.',
  },
  {
    title: "You're ready",
    context: 'Your coaching loop is live. Open the Dashboard to see your first readiness snapshot.',
  },
];

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: (direction) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [connectingStrava, setConnectingStrava] = useState(false);
  const [requestedIntegrations, setRequestedIntegrations] = useState({});
  const [requestingIntegration, setRequestingIntegration] = useState('');

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
        race_distance_km: distanceKm,
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

  const handleRequestIntegration = async (source) => {
    try {
      setRequestingIntegration(source);
      await userProfileAPI.requestIntegrationInterest(source);
      setRequestedIntegrations((prev) => ({ ...prev, [source]: true }));
    } catch (err) {
      console.error('Failed to request integration access:', err);
    } finally {
      setRequestingIntegration('');
    }
  };

  const weeksUntilRace = () => {
    if (!raceDate) return null;
    const diff = new Date(raceDate) - new Date();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col">

      {/* ── Navy header: brand + step progress + title ─────────── */}
      <div className="bg-navy text-white px-6 pt-8 pb-10 sm:pt-10">
        <div className="max-w-[520px] mx-auto">

          {/* Brand */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className="w-7 h-7 bg-coral rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              K
            </div>
            <span
              className="font-semibold text-sm tracking-wide text-white/60"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Korsana
            </span>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    i < step
                      ? 'bg-coral text-white'
                      : i === step
                      ? 'bg-white text-navy'
                      : 'bg-white/20 text-white/40'
                  }`}
                >
                  {i < step ? <LuCheck size={11} strokeWidth={3} /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`h-px w-8 sm:w-12 transition-colors ${
                      i < step ? 'bg-coral/60' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
            <span className="ml-2 text-xs text-white/40" style={{ fontFamily: 'var(--font-mono)' }}>
              {step + 1}/{totalSteps}
            </span>
          </div>

          {/* Step title + context — animates on step change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${step}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <h1
                className="text-xl sm:text-2xl font-bold text-white mb-1.5"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {STEPS[step].title}
              </h1>
              <p className="text-sm text-white/60 leading-relaxed">
                {STEPS[step].context}
              </p>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* ── Step content ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[520px]">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <motion.div
                key="welcome"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-5"
              >
                <div className="card p-6 flex flex-col gap-5">
                  {[
                    {
                      icon: LuZap,
                      label: 'AI coach grounded in your data',
                      desc: 'Korsana reads your Strava history — every run, pace, and HR file — before it advises you.',
                    },
                    {
                      icon: LuFlag,
                      label: 'Race-first planning',
                      desc: 'Every metric ties back to your finish line and how many weeks you have left to prepare.',
                    },
                    {
                      icon: LuCalendar,
                      label: 'Daily readiness, not just a plan',
                      desc: 'Recovery score, injury risk, and a predicted finish time — updated every day.',
                    },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-lg bg-[var(--navy-tint)] flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-navy" />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold text-navy"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-text-muted leading-relaxed mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={goNext}
                  className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  Get Started
                  <LuArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── Step 1: Connect Strava ── */}
            {step === 1 && (
              <motion.div
                key="connect"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-5"
              >
                {stravaConnected ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="card p-6 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                      <LuCheck size={20} className="text-success" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p
                        className="font-semibold text-navy text-sm"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Strava Connected
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Your activities will sync automatically.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="card p-6 flex flex-col gap-3">
                    <button
                      onClick={handleConnectStrava}
                      disabled={connectingStrava}
                      className="btn w-full py-3 font-semibold text-white border-none flex items-center justify-center gap-2"
                      style={{ background: 'var(--color-strava)', opacity: connectingStrava ? 0.7 : 1 }}
                    >
                      <BrandIcon brand="strava" size={16} />
                      {connectingStrava ? 'Redirecting to Strava…' : 'Connect Strava'}
                    </button>

                    <div className="border-t border-border pt-3 flex flex-col gap-2">
                      {[ 
                        { brand: 'garmin', label: 'Garmin Connect', color: 'var(--color-garmin)' },
                        { brand: 'coros',  label: 'Coros',          color: 'var(--color-coros)' },
                      ].map(({ brand, label, color }) => {
                        const requested = Boolean(requestedIntegrations[brand]);
                        return (
                        <button
                          key={brand}
                          onClick={() => handleRequestIntegration(brand)}
                          disabled={requested || requestingIntegration === brand}
                          className={`btn w-full py-2.5 font-semibold border-none flex items-center justify-center gap-2 text-sm ${requested ? 'text-navy' : 'text-white'}`}
                          style={{ background: requested ? 'var(--navy-tint)' : color, opacity: requestingIntegration === brand ? 0.7 : 1 }}
                        >
                          <BrandIcon brand={brand} size={15} />
                          {label}
                          <span className="ml-auto text-[10px] tracking-widest uppercase opacity-80">
                            {requested ? 'Requested' : requestingIntegration === brand ? 'Saving' : 'Beta'}
                          </span>
                        </button>
                        );
                      })}
                    </div>

                    <p className="text-xs text-text-muted text-center leading-relaxed pt-1">
                      Read-only access. Korsana never writes to your Strava account.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={goBack} className="btn btn-outline flex-1">
                    Back
                  </button>
                  <button
                    onClick={goNext}
                    className="btn btn-primary flex-[2] flex items-center justify-center gap-2"
                  >
                    {stravaConnected ? 'Continue' : 'Skip for now'}
                    <LuArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Race Goal ── */}
            {step === 2 && (
              <motion.div
                key="goal"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-4"
              >
                <div className="card p-6">
                  {error && (
                    <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 text-sm text-error font-medium mb-5">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="label block mb-1.5">Race name</label>
                      <input
                        className="input w-full"
                        type="text"
                        placeholder="e.g. Miami Marathon 2026"
                        value={raceName}
                        onChange={(e) => setRaceName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label block mb-1.5">Race date</label>
                      <input
                        className="input w-full"
                        type="date"
                        value={raceDate}
                        onChange={(e) => setRaceDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label block mb-1.5">Distance</label>
                      <div className="grid grid-cols-4 gap-2">
                        {DISTANCES.map((d) => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => { setSelectedDistance(d.label); setCustomDistance(''); }}
                            className={`btn text-sm py-2 transition-all ${
                              selectedDistance === d.label
                                ? 'bg-navy text-white font-semibold border-navy'
                                : 'bg-bg-elevated text-text-primary border border-border hover:border-navy/30'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                      <input
                        className="input w-full mt-2"
                        type="number"
                        placeholder="Or custom distance (km)"
                        value={customDistance}
                        onChange={(e) => { setCustomDistance(e.target.value); setSelectedDistance(null); }}
                      />
                    </div>

                    <div>
                      <label className="label block mb-1.5">Goal type</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'time',   label: 'Target Time' },
                          { value: 'finish', label: 'Just Finish' },
                          { value: 'pr',     label: 'PR' },
                        ].map((gt) => (
                          <button
                            key={gt.value}
                            type="button"
                            onClick={() => setGoalType(gt.value)}
                            className={`btn flex-1 text-sm py-2 transition-all ${
                              goalType === gt.value
                                ? 'bg-navy text-white font-semibold border-navy'
                                : 'bg-bg-elevated text-text-primary border border-border hover:border-navy/30'
                            }`}
                          >
                            {gt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(goalType === 'time' || goalType === 'pr') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="label block mb-1.5">Target time</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            className="input text-center"
                            style={{ fontFamily: 'var(--font-mono)' }}
                            type="number"
                            placeholder="Hrs"
                            min="0"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                          />
                          <input
                            className="input text-center"
                            style={{ fontFamily: 'var(--font-mono)' }}
                            type="number"
                            placeholder="Min"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                          />
                          <input
                            className="input text-center"
                            style={{ fontFamily: 'var(--font-mono)' }}
                            type="number"
                            placeholder="Sec"
                            min="0"
                            max="59"
                            value={seconds}
                            onChange={(e) => setSeconds(e.target.value)}
                          />
                        </div>
                      </motion.div>
                    )}

                    {raceName && raceDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--navy-tint)] rounded-xl px-4 py-3 text-sm flex items-center gap-3"
                      >
                        <LuFlag size={14} className="text-navy shrink-0" />
                        <span>
                          <strong className="text-navy">{raceName}</strong>
                          {weeksUntilRace() !== null && (
                            <span className="text-text-secondary"> — {weeksUntilRace()} weeks away</span>
                          )}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="btn btn-outline flex-1">
                    Back
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    disabled={submitting}
                    className="btn btn-primary flex-[2] flex items-center justify-center gap-2"
                    style={{ opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Creating goal…' : (
                      <>Set Goal <LuArrowRight size={15} /></>
                    )}
                  </button>
                </div>
                <button
                  onClick={goNext}
                  className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors text-center py-1"
                >
                  Skip for now
                </button>
              </motion.div>
            )}

            {/* ── Step 3: Ready ── */}
            {step === 3 && (
              <motion.div
                key="ready"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-5"
              >
                <div className="card p-8 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 18 }}
                    className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-5"
                  >
                    <LuCheck size={26} strokeWidth={2.5} />
                  </motion.div>
                  <p className="text-text-secondary leading-relaxed text-sm max-w-xs mx-auto">
                    Your dashboard is live. Connect Strava or log your first run to see your
                    readiness score, training load, and AI coaching briefing.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    await completeOnboarding();
                    navigate('/dashboard');
                  }}
                  className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  Open Dashboard
                  <LuArrowRight size={16} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default Onboarding;
