import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuArrowRight, LuCheck, LuShieldCheck, LuSlidersHorizontal } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BrandIcon from '../components/BrandIcon';
import { stravaAPI } from '../api/strava';

const CURRENT_YEAR = new Date().getFullYear();

/* ─── Marathon Majors ──────────────────────────────────────────── */
const MAJORS = [
  { city: 'Boston',  country: 'USA',     month: 'Apr', img: '/Boston.jpg' },
  { city: 'London',  country: 'UK',      month: 'Apr', img: '/London.jpg' },
  { city: 'Berlin',  country: 'Germany', month: 'Sep', img: '/Berlin.jpg' },
  { city: 'Chicago', country: 'USA',     month: 'Oct', img: '/Chicago.jpg' },
  { city: 'NYC',     country: 'USA',     month: 'Nov', img: '/NewYorkCity.jpg' },
  { city: 'Tokyo',   country: 'Japan',   month: 'Mar', img: '/Tokyo.jpg' },
];

/* ─── How it works ─────────────────────────────────────────────── */
const HOW_STEPS = [
  {
    num: '01',
    title: 'Connect Strava',
    desc: 'Your full training history — every run, pace, and heart rate — becomes the foundation. No manual entry.',
  },
  {
    num: '02',
    title: 'Set a race goal',
    desc: 'Pick your race and target time. Every metric, recommendation, and coaching conversation orients around that day.',
  },
  {
    num: '03',
    title: 'Get daily coaching',
    desc: 'Check your recovery score, training load, predicted finish time, and today\'s AI brief every morning.',
  },
  {
    num: '04',
    title: 'Adapt as you train',
    desc: 'When your data changes, the coach adjusts. Accept a plan change, ask why, or override it — you\'re in charge.',
  },
];

/* ─── Feature cards ────────────────────────────────────────────── */
const FEATURES = [
  {
    label: 'Training Load',
    desc: 'Your 7-day acute load vs. 42-day fitness baseline — so you know exactly when you\'re building fitness vs. digging a hole.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    accent: 'text-[var(--color-info)]',
    bg: 'bg-[rgba(74,108,247,0.08)] border-[rgba(74,108,247,0.15)]',
  },
  {
    label: 'Recovery Score',
    desc: 'Calculated from your last hard session, hours elapsed, and HR history. Know if today is a push day or a rest day.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    accent: 'text-coral',
    bg: 'bg-coral/10 border-coral/20',
  },
  {
    label: 'Race Predictor',
    desc: 'Predicts your 5K through marathon finish time from your actual Strava efforts — not age-grade tables or generic formulas.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    accent: 'text-sage',
    bg: 'bg-sage/10 border-sage/20',
  },
];

/* ─── Proof callouts ───────────────────────────────────────────── */
const PROOF = [
  {
    icon: <LuShieldCheck size={22} className="text-coral" />,
    headline: 'Predicts your finish time from real Strava data',
    body: 'Not age-grade tables or VO₂ max estimates. Your actual recent efforts, plugged into a race model calibrated to your fitness.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    headline: 'Knows your HR zones, long run history, and injury signals',
    body: 'Korsana tracks time-in-zone, cadence, mileage trends, and load spikes — the same signals a professional coach watches.',
  },
  {
    icon: <LuSlidersHorizontal size={22} className="text-[var(--color-info)]" />,
    headline: 'Plans are suggestions. You decide what runs.',
    body: 'Accept a plan, tweak it, or ignore it. The coach adapts to what you actually do — not what you said you\'d do.',
  },
];

/* ─── AI Coach benefits ────────────────────────────────────────── */
const BENEFITS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: 'Adapts to your actual training',
    desc: 'Your plan adjusts week to week based on how your body is responding — not a rigid template built for someone else.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Race-day strategy built in',
    desc: 'Pacing targets, taper schedules, and fuelling windows — all calculated from your real data, not a generic race-day guide.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Ask anything, anytime',
    desc: 'Questions about your splits, your recovery, your next long run — the coach always has context because it always has your data.',
  },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleConnectStrava = async () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    try {
      const { url } = await stravaAPI.getAuthURL();
      window.location.href = url;
    } catch {
      navigate('/settings');
    }
  };

  return (
    <div className="min-h-screen bg-bg-app font-sans">
      <Navbar variant="landing" />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="border-b border-border-light relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundImage: 'url(/landing_run.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 70%' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/95 via-white/80 to-white/30" />

        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-10 md:py-14 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: copy */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage/10 border border-sage/25 mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-sage uppercase tracking-widest">Now in Beta</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-navy mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Your <span className="text-coral">plan</span>,<br />
                our <span className="text-coral">goal</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="text-lg md:text-xl text-text-secondary mb-4 leading-relaxed font-medium"
              >
                Pick your race. Connect Strava. Korsana reads your training history and builds
                a coaching loop around you — daily readiness, injury risk, a predicted finish time,
                and an AI coach who knows every run.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="text-base text-text-muted mb-8 font-medium"
              >
                Serious coaching support. No coach pricing.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <Link
                  to="/signup"
                  className="btn btn-primary btn-lg w-full sm:w-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Get Started
                  <LuArrowRight size={16} />
                </Link>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn bg-white border border-border text-navy hover:bg-bg-app btn-lg w-full sm:w-auto transition-colors"
                >
                  See how it works
                </button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-4 text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-4"
              >
                <span className="flex items-center gap-1.5">
                  <LuCheck size={11} />No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <LuCheck size={11} />Free to get started
                </span>
              </motion.p>
            </div>

            {/* Right: dashboard card mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="hidden lg:flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-[520px] bg-white rounded-2xl border border-border shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-light bg-bg-app">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-coral" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber" />
                    <div className="w-2.5 h-2.5 rounded-full bg-sage" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">
                    TARGET · SUB-3 MARATHON
                  </span>
                  <div />
                </div>

                <div className="px-6 pt-6 pb-4 text-center">
                  <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-2">Projected Finish Time</p>
                  <div className="text-7xl font-extrabold text-navy tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
                    2:59:59
                  </div>
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-sage/10 border border-sage/20">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    <span className="text-xs font-mono font-bold text-sage">On Track for PR</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-border-light mx-6 mb-4 rounded-xl overflow-hidden border border-border">
                  <div className="bg-white px-4 py-3">
                    <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-1">Avg Pace</p>
                    <p className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-mono)' }}>8:42</p>
                  </div>
                  <div className="bg-white px-4 py-3">
                    <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-1">Weekly Load</p>
                    <p className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-mono)' }}>+22 <span className="text-sm font-normal text-text-muted">%</span></p>
                  </div>
                </div>

                <div className="mx-6 mb-3 flex items-start gap-3 bg-amber/10 border border-amber/20 rounded-xl px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  <div>
                    <p className="text-xs font-bold text-navy">Effort spike detected.</p>
                    <p className="text-xs text-text-muted mt-0.5">Last 3 runs averaged 15% harder than baseline. Easy day advised.</p>
                  </div>
                </div>
                <div className="mx-6 mb-6 flex items-start gap-3 bg-coral/10 border border-coral/20 rounded-xl px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-coral)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  <div>
                    <p className="text-xs font-bold text-navy">Training load up 22% this week.</p>
                    <p className="text-xs text-text-muted mt-0.5">Consider an easy run before your long run Sunday.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.5 }}
            className="flex flex-wrap items-center gap-12 mt-20 pt-10 border-t border-border-light"
          >
            {[
              { stat: '10+',  label: 'Active Runners' },
              { stat: '15+',  label: 'Plans Generated' },
              { stat: '500+', label: 'Miles Analyzed' },
              { stat: '12+',  label: 'Races Targeted' },
            ].map(({ stat, label }, i) => (
              <div key={label}>
                {i > 0 && <div className="w-px h-8 bg-border-light hidden sm:block absolute" style={{ marginLeft: -24 }} />}
                <span className="text-2xl md:text-3xl font-bold text-navy block mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>{stat}</span>
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How Korsana works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-mono font-bold text-coral uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              From first run to race day.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Four steps. One continuous loop that gets smarter as you train.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative"
              >
                {/* Connector line */}
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-1rem)] w-8 h-px bg-border z-10" />
                )}
                <div className="bg-bg-app rounded-2xl border border-border p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-navy flex items-center justify-center mb-4">
                    <span className="font-mono font-bold text-sm text-white">{s.num}</span>
                  </div>
                  <h3 className="font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{s.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precision Metrics ─────────────────────────────────────── */}
      <section id="features" className="py-20 bg-bg-app border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-mono font-bold text-coral uppercase tracking-widest mb-3">Precision Metrics</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Numbers that actually mean something.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              14 training metrics, all anchored to your race goal and the phase you're in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.label} className="card p-8 flex flex-col gap-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${f.bg} ${f.accent} shrink-0`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{f.label}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof / Trust callouts ────────────────────────────────── */}
      <section className="py-16 bg-white border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROOF.map((p, i) => (
              <motion.div
                key={p.headline}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--navy-tint)] border border-[rgba(27,37,89,0.08)] flex items-center justify-center shrink-0">
                  {p.icon}
                </div>
                <h3 className="font-bold text-navy leading-snug" style={{ fontFamily: 'var(--font-heading)' }}>
                  {p.headline}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Coach ──────────────────────────────────────────────── */}
      <section id="coach" className="py-24 bg-navy relative overflow-hidden border-b border-navy/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Chat mockup */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="w-8 h-8 rounded-full bg-coral/20 border border-coral/30 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-coral)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /><path d="M12 8v4l3 3" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Korsana Coach</p>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Analyzing your data</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-sage animate-pulse" />
              </div>

              <div className="p-5 space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-navy/60 border border-white/15 rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm text-white/90">I've never run more than 5 miles. I signed up for a half marathon in 14 weeks — where do I even start?</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-coral uppercase tracking-widest block mb-2">Korsana</span>
                    <p className="text-sm text-white/85">
                      14 weeks is plenty — I've seen your recent runs on Strava and your aerobic base is stronger than you think.
                    </p>
                    <p className="text-sm text-white/85">
                      I've built you a <span className="text-sage font-bold">14-week plan</span> with 4 runs per week. Your long run grows no more than 10% each week so you stay injury-free.
                    </p>
                    <p className="text-sm text-white/85">
                      Start at <span className="text-coral font-bold font-mono">11:30/mi</span> for long runs — slower than you think you need to go, which is exactly right.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <p className="text-sm text-white/30">Ask about your training…</p>
                  </div>
                  <button className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center shadow-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-xs font-mono font-bold text-coral uppercase tracking-widest mb-4">Your AI Training Copilot</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                A coach that actually knows your training.
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-10">
                Most apps give you a plan and walk away. Korsana reads your Strava data, tracks how your body is
                responding, and adjusts — then lets you have a real conversation about it.
              </p>

              <div className="space-y-6">
                {BENEFITS.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-coral shrink-0">
                      {b.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{b.title}</h3>
                      <p className="text-sm text-white/55 leading-relaxed">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  to="/signup"
                  className="btn btn-primary btn-lg border-none shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Get started with Korsana
                  <LuArrowRight size={15} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────────────────── */}
      <section className="py-24 border-b border-border-light relative overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'url(/black&white_run.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 z-0 bg-white/75" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono font-bold text-coral uppercase tracking-widest mb-3">Integrations</p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-5" style={{ fontFamily: 'var(--font-heading)' }}>
                Connect Strava and go.
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed mb-8">
                Link your Strava account and Korsana pulls your full activity history — runs, paces, heart rate,
                elevation, and more — to immediately understand where you are in your fitness.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-app">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center shrink-0">
                    <BrandIcon brand="strava" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>Strava</p>
                      <span className="text-[10px] font-mono font-bold text-sage bg-sage/10 border border-sage/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
                    </div>
                    <p className="text-sm text-text-secondary">Full activity sync — runs, HR, cadence, pace, elevation.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-bg-app opacity-70">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border-light shadow-sm flex items-center justify-center shrink-0">
                    <BrandIcon brand="garmin" size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>Garmin</p>
                      <span className="text-[10px] font-mono font-bold text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Coming Soon</span>
                    </div>
                    <p className="text-sm text-text-secondary">Direct device sync — ground contact, HRV, sleep, body battery.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-bg-app opacity-70">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border-light shadow-sm flex items-center justify-center shrink-0">
                    <BrandIcon brand="coros" size={48} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>Coros</p>
                      <span className="text-[10px] font-mono font-bold text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Coming Soon</span>
                    </div>
                    <p className="text-sm text-text-secondary">Training load, EvoLab metrics, and structured workout sync.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-[360px] bg-bg-app rounded-2xl border border-border p-8 shadow-lg text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center mx-auto mb-6">
                  <BrandIcon brand="strava" size={32} />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Connect with Strava</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  One click. Korsana reads your history and starts building your coaching loop immediately.
                </p>
                <button
                  onClick={handleConnectStrava}
                  className="w-full btn bg-[#FC4C02] hover:bg-[#e04400] text-white btn-md border-none transition-colors"
                >
                  <BrandIcon brand="strava" size={16} />
                  {user ? 'Connect Strava' : 'Get Started with Strava'}
                </button>
                <p className="text-[10px] font-mono text-text-muted mt-4 uppercase tracking-widest">Read-only access · We never post on your behalf</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marathon Majors ───────────────────────────────────────── */}
      <section className="py-14 bg-bg-app border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-mono font-bold text-coral uppercase tracking-widest mb-3">Dream big</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Everyone starts somewhere.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Your first race might be a local 5K. But the plan you build today is the same foundation that gets
              runners to any finish line — including the World Majors.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {MAJORS.map((race) => (
              <div key={race.city} className="group relative rounded-2xl overflow-hidden aspect-[3/4] border border-border shadow-sm cursor-default">
                <img src={race.img} alt={`${race.city} Marathon`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{race.city}</p>
                  <p className="text-white/60 font-mono text-[10px] uppercase tracking-widest">{race.month}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs font-mono text-text-muted mt-8 uppercase tracking-widest">
            World Marathon Majors · Boston · London · Berlin · Chicago · New York · Tokyo
          </p>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────── */}
      <footer className="py-14 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Your race. Your data.<br />Your coach.
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
            Connect Strava, set your race, and get a coaching loop that adapts as you train —
            not a template built for someone else.
          </p>
          <Link
            to="/signup"
            className="btn btn-primary btn-lg shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Get started free
            <LuArrowRight size={16} />
          </Link>
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-xs font-mono text-white/40 hover:text-white/70 transition-colors no-underline uppercase tracking-widest">Terms of Service</Link>
              <span className="text-white/20 text-xs">·</span>
              <Link to="/privacy" className="text-xs font-mono text-white/40 hover:text-white/70 transition-colors no-underline uppercase tracking-widest">Privacy Policy</Link>
            </div>
            <p className="text-xs font-mono text-white/25 tracking-wide uppercase">
              &copy; {CURRENT_YEAR} Korsana Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
