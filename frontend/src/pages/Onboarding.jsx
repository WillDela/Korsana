import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCheck, LuArrowRight, LuFlag, LuCalendar, LuZap } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
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
    context: 'Korsana reads your Strava history to give grounded advice instead of generic plans.',
  },
  {
    title: 'Set your race goal',
    context: 'This anchors your training calendar, finish predictor, and daily coaching briefing.',
  },
  {
    title: "You're ready",
    context: 'Your coaching loop is live. Open the dashboard to see your first readiness snapshot.',
  },
];

const WELCOME_POINTS = [
  {
    icon: LuZap,
    label: 'AI coach grounded in your data',
    desc: 'Import real pace, effort, and heart-rate history before your first recommendation.',
  },
  {
    icon: LuFlag,
    label: 'Race-first planning',
    desc: 'Keep every workout tied to a finish line, timeline, and realistic outcome.',
  },
  {
    icon: LuCalendar,
    label: 'Daily readiness checks',
    desc: 'See recovery, injury risk, and guidance that updates as your training changes.',
  },
];

const SETUP_NOTES = [
  { label: 'About 2 minutes', value: 'Fast setup' },
  { label: 'Skip optional steps', value: 'No dead ends' },
  { label: 'Edit later anytime', value: 'Flexible' },
];

const INTEGRATION_OPTIONS = [
  { brand: 'garmin', label: 'Garmin Connect', color: 'var(--color-garmin)' },
  { brand: 'coros', label: 'Coros', color: 'var(--color-coros)' },
];

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
  exit: (direction) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

const getGoalTypeLabel = (goalType) => {
  if (goalType === 'pr') return 'Personal record';
  if (goalType === 'finish') return 'Finish strong';
  return 'Target time';
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stravaConnected] = useState(false);
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

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];

  const goToStep = (nextStep) => {
    if (nextStep === step) return;
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const goNext = () => {
    goToStep(Math.min(step + 1, totalSteps - 1));
  };

  const goBack = () => {
    goToStep(Math.max(step - 1, 0));
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

    if (!raceName.trim()) {
      setError('Race name is required');
      return;
    }

    if (!raceDate) {
      setError('Race date is required');
      return;
    }

    const distanceKm = selectedDistance
      ? DISTANCES.find((item) => item.label === selectedDistance)?.km
      : parseFloat(customDistance);

    if (!distanceKm || distanceKm <= 0) {
      setError('Select or enter a valid distance');
      return;
    }

    let targetTimeSeconds = null;
    if (goalType === 'time' || goalType === 'pr') {
      const h = parseInt(hours, 10) || 0;
      const m = parseInt(minutes, 10) || 0;
      const s = parseInt(seconds, 10) || 0;
      targetTimeSeconds = h * 3600 + m * 60 + s;

      if (targetTimeSeconds <= 0) {
        setError('Enter a valid target time');
        return;
      }
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

  const targetTimePreview =
    goalType === 'time' || goalType === 'pr'
      ? [hours || '00', minutes || '00', seconds || '00'].join(':')
      : 'Not required';

  const selectedDistancePreview = selectedDistance || (customDistance ? `${customDistance} km` : 'Choose a distance');

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-app">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(232,114,90,0.12), transparent 30%), radial-gradient(circle at top right, rgba(27,37,89,0.10), transparent 22%), linear-gradient(180deg, #f9faff 0%, #f5f6fa 48%, #eef1f8 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/70 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[28px] bg-navy text-white shadow-[0_24px_70px_rgba(17,25,64,0.24)]">
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral text-base font-bold text-white"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  K
                </div>
                <div>
                  <p
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Korsana
                  </p>
                  <p className="text-xs text-white/60">Onboarding flow</p>
                </div>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                <span>Step {step + 1}</span>
                <span className="text-white/35">/</span>
                <span>{totalSteps}</span>
              </div>

              <div className="mt-6 space-y-3">
                {STEPS.map((item, index) => {
                  const isComplete = index < step;
                  const isCurrent = index === step;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        if (index <= step) goToStep(index);
                      }}
                      className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                        isCurrent
                          ? 'bg-white text-navy shadow-lg'
                          : isComplete
                            ? 'bg-white/10 text-white hover:bg-white/14'
                            : 'bg-white/[0.03] text-white/50'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent
                            ? 'bg-navy text-white'
                            : isComplete
                              ? 'bg-coral text-white'
                              : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {isComplete ? <LuCheck size={13} strokeWidth={3} /> : index + 1}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent ? 'text-navy' : isComplete ? 'text-white' : 'text-white/65'
                          }`}
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {item.title}
                        </p>
                        <p className={`mt-1 text-xs leading-relaxed ${isCurrent ? 'text-text-secondary' : 'text-white/55'}`}>
                          {item.context}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.04] p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Quick setup
              </p>
              <div className="mt-4 space-y-3">
                {SETUP_NOTES.map((note) => (
                  <div
                    key={note.label}
                    className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">{note.value}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{note.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="overflow-hidden rounded-[30px] border border-white/70 bg-white/92 shadow-[0_20px_60px_rgba(27,37,89,0.12)] backdrop-blur-sm">
            <div className="border-b border-border-light px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-coral">
                    Phase {step + 1}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`header-${step}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h1
                        className="mt-2 text-2xl font-bold text-navy sm:text-[2rem]"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {currentStep.title}
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-[15px]">
                        {currentStep.context}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="rounded-[20px] border border-border-light bg-bg-elevated px-4 py-3 sm:min-w-[120px] sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                    Current phase
                  </p>
                  <p
                    className="mt-1 text-2xl font-bold text-navy"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {step + 1}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-8 sm:py-8">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 0 && (
                  <motion.section
                    key="welcome"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex min-h-[460px] flex-col justify-between gap-8"
                  >
                    <div className="space-y-4">
                      <div
                        className="rounded-[28px] border border-border-light p-6 sm:p-7"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,240,237,0.92) 0%, rgba(250,251,255,0.98) 58%, rgba(232,240,222,0.72) 100%)',
                        }}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
                          What you unlock
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          {WELCOME_POINTS.map(({ icon: Icon, label, desc }) => (
                            <div
                              key={label}
                              className="rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-[0_10px_30px_rgba(27,37,89,0.06)]"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--navy-tint)] text-navy">
                                <Icon size={18} />
                              </div>
                              <p
                                className="mt-4 text-sm font-semibold text-navy"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {label}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                                {desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {SETUP_NOTES.map((note) => (
                          <div
                            key={note.value}
                            className="rounded-[22px] border border-border-light bg-white px-4 py-4 shadow-[0_8px_20px_rgba(27,37,89,0.04)]"
                          >
                            <p className="text-sm font-semibold text-navy">{note.value}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">
                              {note.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-border-light pt-5">
                      <button
                        type="button"
                        onClick={goNext}
                        className="btn btn-primary min-w-[190px] px-6 py-3"
                      >
                        Get Started
                        <LuArrowRight size={16} />
                      </button>
                    </div>
                  </motion.section>
                )}

                {step === 1 && (
                  <motion.section
                    key="connect"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex min-h-[460px] flex-col justify-between gap-8"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_280px]">
                      <div className="rounded-[28px] border border-border-light bg-white p-6 shadow-[0_10px_30px_rgba(27,37,89,0.05)] sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
                              Recommended
                            </p>
                            <h2
                              className="mt-2 text-xl font-bold text-navy"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              Connect Strava first
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                              This gives Korsana the context it needs to build useful coaching from day one.
                            </p>
                          </div>

                          <div className="rounded-full bg-[var(--coral-tint)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
                            Read only
                          </div>
                        </div>

                        {stravaConnected ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 flex items-center gap-4 rounded-[22px] border border-success/20 bg-success/8 px-4 py-4"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
                              <LuCheck size={20} strokeWidth={2.6} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-navy">Strava connected</p>
                              <p className="mt-1 text-sm text-text-secondary">
                                Your activities will sync automatically.
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="mt-6 rounded-[24px] border border-border-light bg-bg-elevated p-5">
                            <button
                              type="button"
                              onClick={handleConnectStrava}
                              disabled={connectingStrava}
                              className="btn w-full justify-center border-none px-5 py-3 text-white"
                              style={{
                                background: 'var(--color-strava)',
                                opacity: connectingStrava ? 0.72 : 1,
                              }}
                            >
                              <BrandIcon brand="strava" size={16} />
                              {connectingStrava ? 'Redirecting to Strava...' : 'Connect Strava'}
                            </button>
                            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                              Your account stays read-only. Korsana never writes workouts back to Strava.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[28px] border border-border-light bg-bg-elevated p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                            Other platforms
                          </p>
                          <div className="mt-4 flex flex-col gap-3">
                            {INTEGRATION_OPTIONS.map(({ brand, label, color }) => {
                              const requested = Boolean(requestedIntegrations[brand]);
                              return (
                                <button
                                  key={brand}
                                  type="button"
                                  onClick={() => handleRequestIntegration(brand)}
                                  disabled={requested || requestingIntegration === brand}
                                  className={`btn w-full justify-start border-none px-4 py-3 text-sm ${
                                    requested ? 'text-navy' : 'text-white'
                                  }`}
                                  style={{
                                    background: requested ? 'var(--navy-tint)' : color,
                                    opacity: requestingIntegration === brand ? 0.72 : 1,
                                  }}
                                >
                                  <BrandIcon brand={brand} size={15} />
                                  <span>{label}</span>
                                  <span className="ml-auto text-[10px] uppercase tracking-[0.18em] opacity-80">
                                    {requested
                                      ? 'Requested'
                                      : requestingIntegration === brand
                                        ? 'Saving'
                                        : 'Beta'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-border-light bg-white p-5">
                          <p className="text-sm font-semibold text-navy">You can skip this step</p>
                          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                            The dashboard will still open. You can connect sources later from settings.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border-light pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={goBack} className="btn btn-outline px-5 py-3 sm:min-w-[120px]">
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="btn btn-primary px-6 py-3 sm:min-w-[190px]"
                      >
                        {stravaConnected ? 'Continue' : 'Skip for now'}
                        <LuArrowRight size={15} />
                      </button>
                    </div>
                  </motion.section>
                )}

                {step === 2 && (
                  <motion.section
                    key="goal"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex min-h-[460px] flex-col justify-between gap-8"
                  >
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="rounded-[28px] border border-border-light bg-white p-6 shadow-[0_10px_30px_rgba(27,37,89,0.05)] sm:p-7">
                        {error && (
                          <div className="mb-5 rounded-[18px] border border-error/25 bg-error/10 px-4 py-3 text-sm font-medium text-error">
                            {error}
                          </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="label block pb-1.5">Race name</label>
                            <input
                              className="input w-full"
                              type="text"
                              placeholder="e.g. Miami Marathon 2026"
                              value={raceName}
                              onChange={(event) => setRaceName(event.target.value)}
                            />
                          </div>

                          <div>
                            <label className="label block pb-1.5">Race date</label>
                            <input
                              className="input w-full"
                              type="date"
                              value={raceDate}
                              onChange={(event) => setRaceDate(event.target.value)}
                            />
                          </div>
                        </div>

                        <div className="mt-5">
                          <label className="label block pb-1.5">Distance</label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {DISTANCES.map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  setSelectedDistance(item.label);
                                  setCustomDistance('');
                                }}
                                className={`btn px-3 py-2 text-sm ${
                                  selectedDistance === item.label
                                    ? 'border-navy bg-navy text-white'
                                    : 'border border-border bg-bg-elevated text-text-primary hover:border-navy/30'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>

                          <input
                            className="input mt-2 w-full"
                            type="number"
                            placeholder="Or custom distance (km)"
                            value={customDistance}
                            onChange={(event) => {
                              setCustomDistance(event.target.value);
                              setSelectedDistance(null);
                            }}
                          />
                        </div>

                        <div className="mt-5">
                          <label className="label block pb-1.5">Goal type</label>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[
                              { value: 'time', label: 'Target Time' },
                              { value: 'finish', label: 'Just Finish' },
                              { value: 'pr', label: 'PR' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setGoalType(option.value)}
                                className={`btn px-3 py-2 text-sm ${
                                  goalType === option.value
                                    ? 'border-navy bg-navy text-white'
                                    : 'border border-border bg-bg-elevated text-text-primary hover:border-navy/30'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {(goalType === 'time' || goalType === 'pr') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="mt-5"
                          >
                            <label className="label block pb-1.5">Target time</label>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                className="input text-center"
                                style={{ fontFamily: 'var(--font-mono)' }}
                                type="number"
                                placeholder="Hrs"
                                min="0"
                                value={hours}
                                onChange={(event) => setHours(event.target.value)}
                              />
                              <input
                                className="input text-center"
                                style={{ fontFamily: 'var(--font-mono)' }}
                                type="number"
                                placeholder="Min"
                                min="0"
                                max="59"
                                value={minutes}
                                onChange={(event) => setMinutes(event.target.value)}
                              />
                              <input
                                className="input text-center"
                                style={{ fontFamily: 'var(--font-mono)' }}
                                type="number"
                                placeholder="Sec"
                                min="0"
                                max="59"
                                value={seconds}
                                onChange={(event) => setSeconds(event.target.value)}
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[28px] border border-border-light bg-bg-elevated p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                            Goal preview
                          </p>
                          <div className="mt-4 space-y-3">
                            <div className="rounded-[18px] bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Race</p>
                              <p className="mt-1 text-sm font-semibold text-navy">
                                {raceName || 'Choose your target race'}
                              </p>
                            </div>
                            <div className="rounded-[18px] bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Distance</p>
                              <p className="mt-1 text-sm font-semibold text-navy">{selectedDistancePreview}</p>
                            </div>
                            <div className="rounded-[18px] bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Goal</p>
                              <p className="mt-1 text-sm font-semibold text-navy">{getGoalTypeLabel(goalType)}</p>
                            </div>
                            <div className="rounded-[18px] bg-white px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Target time</p>
                              <p className="mt-1 text-sm font-semibold text-navy">{targetTimePreview}</p>
                            </div>
                          </div>
                        </div>

                        {(raceName || raceDate) && (
                          <div className="rounded-[24px] border border-border-light bg-white p-5">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--navy-tint)] text-navy">
                                <LuFlag size={15} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-navy">
                                  {raceName || 'Race goal in progress'}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                                  {raceDate || 'Add a date to anchor your plan.'}
                                  {weeksUntilRace() !== null ? ` - ${weeksUntilRace()} weeks away` : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border-light pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={goBack} className="btn btn-outline px-5 py-3 sm:min-w-[120px]">
                        Back
                      </button>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={goNext}
                          className="btn btn-ghost px-4 py-3 text-sm"
                        >
                          Skip for now
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateGoal}
                          disabled={submitting}
                          className="btn btn-primary px-6 py-3 sm:min-w-[190px]"
                          style={{ opacity: submitting ? 0.72 : 1 }}
                        >
                          {submitting ? 'Creating goal...' : 'Set Goal'}
                          {!submitting && <LuArrowRight size={15} />}
                        </button>
                      </div>
                    </div>
                  </motion.section>
                )}

                {step === 3 && (
                  <motion.section
                    key="ready"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex min-h-[460px] flex-col justify-between gap-8"
                  >
                    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center">
                      <div
                        className="w-full rounded-[30px] border border-border-light p-8 text-center shadow-[0_14px_40px_rgba(27,37,89,0.06)] sm:p-10"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,245,234,0.88) 100%)',
                        }}
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                          <LuCheck size={28} strokeWidth={2.5} />
                        </div>
                        <h2
                          className="mt-5 text-2xl font-bold text-navy"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          Your dashboard is ready
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-[15px]">
                          Connect Strava or log your first run to populate readiness, training load,
                          and daily coaching insights.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[20px] bg-white/90 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Race</p>
                            <p className="mt-1 text-sm font-semibold text-navy">
                              {raceName || 'Set later from goals'}
                            </p>
                          </div>
                          <div className="rounded-[20px] bg-white/90 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Distance</p>
                            <p className="mt-1 text-sm font-semibold text-navy">{selectedDistancePreview}</p>
                          </div>
                          <div className="rounded-[20px] bg-white/90 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Goal</p>
                            <p className="mt-1 text-sm font-semibold text-navy">{getGoalTypeLabel(goalType)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border-light pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={goBack} className="btn btn-outline px-5 py-3 sm:min-w-[120px]">
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await completeOnboarding();
                          navigate('/dashboard');
                        }}
                        className="btn btn-primary px-6 py-3 sm:min-w-[210px]"
                      >
                        Open Dashboard
                        <LuArrowRight size={16} />
                      </button>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
