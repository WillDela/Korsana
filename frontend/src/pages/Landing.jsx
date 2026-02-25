import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/* ─── Marathon Majors data ─────────────────────────────────────── */
const MAJORS = [
  { city: 'Boston',  country: 'USA',     month: 'Apr', img: 'https://images.unsplash.com/photo-1562077981-4d7eafd44932?auto=format&fit=crop&q=80&w=600' },
  { city: 'London',  country: 'UK',      month: 'Apr', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&q=80&w=600' },
  { city: 'Berlin',  country: 'Germany', month: 'Sep', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&q=80&w=600' },
  { city: 'Chicago', country: 'USA',     month: 'Oct', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600' },
  { city: 'NYC',     country: 'USA',     month: 'Nov', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=600' },
  { city: 'Tokyo',   country: 'Japan',   month: 'Mar', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600' },
];

/* ─── AI Coach benefits ─────────────────────────────────────────── */
const BENEFITS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: 'Adapts to your training load',
    desc: 'Your plan adjusts week to week based on how your body is actually responding — not a rigid template.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Race-day strategy built in',
    desc: 'Pacing targets, taper schedules, and fuelling windows are all calculated from your real data.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Ask anything, anytime',
    desc: 'Questions about your splits, your recovery, your next long run — the coach always has context.',
  },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg-app font-sans">
      <Navbar variant="landing" />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-border-light relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-navy) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: copy */}
            <div className="max-w-xl">
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-navy mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Your <span className="text-garmin">plan</span>,<br />
                our <span className="text-garmin">goal</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="text-lg md:text-xl text-text-secondary mb-10 leading-relaxed font-medium"
              >
                You've signed up for the race. Now you need a plan — one that fits your schedule,
                your current fitness, and gets you to the finish line.
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <button
                  onClick={() => document.getElementById('coach')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn bg-white border border-border text-navy hover:bg-bg-app btn-lg w-full sm:w-auto transition-colors"
                >
                  See how it works
                </button>
              </motion.div>

            </div>

            {/* Right: Goal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="hidden lg:flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-[420px] bg-white rounded-2xl border border-border shadow-2xl overflow-hidden">
                {/* Card header */}
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

                {/* Projected time */}
                <div className="px-6 pt-6 pb-4 text-center">
                  <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-2">
                    Projected Finish Time
                  </p>
                  <div
                    className="text-6xl font-extrabold text-navy tracking-tight"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    2:59:59
                  </div>
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-sage/10 border border-sage/20">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    <span className="text-xs font-mono font-bold text-sage">On Track for PR</span>
                  </div>
                </div>

                {/* Metric row */}
                <div className="grid grid-cols-2 gap-px bg-border-light mx-6 mb-4 rounded-xl overflow-hidden border border-border">
                  <div className="bg-white px-4 py-3">
                    <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-1">VO2 Max</p>
                    <p className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-mono)' }}>58.2</p>
                  </div>
                  <div className="bg-white px-4 py-3">
                    <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-1">Threshold</p>
                    <p className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-mono)' }}>172 <span className="text-sm font-normal text-text-muted">bpm</span></p>
                  </div>
                </div>

                {/* Alert banner */}
                <div className="mx-6 mb-6 flex items-start gap-3 bg-amber/10 border border-amber/20 rounded-xl px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  <div>
                    <p className="text-xs font-bold text-navy">Recovery suggested.</p>
                    <p className="text-xs text-text-muted mt-0.5">HRV dropped 10% overnight. Rest day advised.</p>
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
            <div>
              <span className="text-2xl md:text-3xl font-bold text-navy block mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>10+</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono">Active Runners</span>
            </div>
            <div>
              <span className="text-2xl md:text-3xl font-bold text-navy block mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>500+</span>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest font-mono">Miles Analyzed</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Strava badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg-app">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FC4C02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
                <span className="text-xs font-bold text-navy font-mono">Strava Connected</span>
              </div>
              <span className="text-xs text-text-muted font-mono">Coros · Garmin <span className="text-amber font-bold">(soon)</span></span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AI Coach ──────────────────────────────────────────────── */}
      <section id="coach" className="py-24 bg-navy relative overflow-hidden border-b border-navy/80">
        <div
          className="absolute inset-0 z-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

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
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="w-8 h-8 rounded-full bg-garmin/20 border border-garmin/30 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-garmin)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /><path d="M12 8v4l3 3" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Korsana AI Coach</p>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Analyzing your data</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-sage animate-pulse" />
              </div>

              {/* Messages */}
              <div className="p-5 space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-garmin/20 border border-garmin/20 rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm text-white/90">I've never run more than 5 miles. I signed up for a half marathon in 14 weeks — where do I even start?</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold text-garmin uppercase tracking-widest">Korsana AI</span>
                    </div>
                    <p className="text-sm text-white/85">
                      14 weeks is plenty of time — I've seen your recent runs on Strava and your aerobic base is stronger than you think.
                    </p>
                    <p className="text-sm text-white/85">
                      I've built you a <span className="text-sage font-bold">16-week plan</span> (starting conservatively this week) with 4 runs per week. Your long run grows by no more than 10% each week so you stay injury-free.
                    </p>
                    <p className="text-sm text-white/85">
                      Your first goal is simple: finish comfortable. Target <span className="text-garmin font-bold font-mono">11:30/mi</span> for your long runs — slower than you think you need to go, which is exactly right.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <p className="text-sm text-white/30">Ask about your training…</p>
                  </div>
                  <button className="w-9 h-9 rounded-xl bg-garmin flex items-center justify-center shadow-lg">
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
              <p className="text-xs font-mono font-bold text-garmin uppercase tracking-widest mb-4">AI Coach</p>
              <h2
                className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                A coach that actually knows your training.
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-10">
                Most apps give you a plan and walk away. Korsana reads your Strava data, tracks how your body is
                responding, and adjusts the plan — then lets you have a real conversation about it.
              </p>

              <div className="space-y-6">
                {BENEFITS.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-garmin shrink-0">
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
                  className="btn bg-garmin hover:bg-[#0068a5] text-white btn-lg border-none shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Get started with Korsana
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Marathon Majors ───────────────────────────────────────── */}
      <section className="py-24 bg-bg-app border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-mono font-bold text-garmin uppercase tracking-widest mb-3">Dream big</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-navy mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Everyone starts somewhere.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Your first race might be a local 5K. But the plan you build today is the same foundation that gets
              runners to Boston, London, and Tokyo. It all starts with a goal and a training block.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {MAJORS.map((race, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] border border-border shadow-sm cursor-default"
              >
                <img
                  src={race.img}
                  alt={`${race.city} Marathon`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{race.city}</p>
                  <p className="text-white/60 font-mono text-[10px] uppercase tracking-widest">{race.month}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs font-mono text-text-muted mt-8 uppercase tracking-widest">
            World Marathon Majors · Boston · London · Berlin · Chicago · New York · Tokyo
          </p>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────────────────── */}
      <section className="py-24 bg-white border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <p className="text-xs font-mono font-bold text-[#FC4C02] uppercase tracking-widest mb-3">Integrations</p>
              <h2
                className="text-3xl md:text-4xl font-bold text-navy mb-5"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Connect Strava and go.
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed mb-8">
                Link your Strava account and Korsana pulls your full activity history — runs, paces, heart rate, elevation —
                to immediately understand where you are in your fitness. No manual entry.
              </p>

              <div className="space-y-4">
                {/* Strava - live */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-app">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FC4C02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>Strava</p>
                      <span className="text-[10px] font-mono font-bold text-sage bg-sage/10 border border-sage/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
                    </div>
                    <p className="text-sm text-text-secondary">Full activity sync — runs, HR, cadence, pace, elevation.</p>
                  </div>
                </div>

                {/* Garmin - coming soon */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-bg-app opacity-70">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border-light shadow-sm flex items-center justify-center shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#007CC3"><path d="M11.967 0L19.5 4.35V13.05L11.967 17.4L4.433 13.05V4.35L11.967 0ZM11.967 2.053L6.2 5.38V12.033L11.967 15.36L17.734 12.033V5.38L11.967 2.053Z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>Garmin</p>
                      <span className="text-[10px] font-mono font-bold text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Coming Soon</span>
                    </div>
                    <p className="text-sm text-text-secondary">Direct device sync — ground contact, HRV, sleep, body battery.</p>
                  </div>
                </div>

                {/* Coros - coming soon */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-bg-app opacity-70">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border-light shadow-sm flex items-center justify-center shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12a4 4 0 0 1 8 0" /></svg>
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

            {/* Strava connect visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="w-full max-w-[360px] bg-bg-app rounded-2xl border border-border p-8 shadow-lg text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center mx-auto mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#FC4C02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
                </div>
                <h3 className="text-lg font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Connect with Strava</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  One click. Korsana reads your history and starts building your plan immediately.
                </p>
                <button className="w-full btn bg-[#FC4C02] hover:bg-[#e04400] text-white btn-md border-none transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
                  Connect Strava
                </button>
                <p className="text-[10px] font-mono text-text-muted mt-4 uppercase tracking-widest">Read-only access · We never post on your behalf</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-navy relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Don't know where to start?<br />That's exactly what we're for.
            </h2>
            <p className="text-white/60 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Connect Strava and tell us your race. We'll handle the rest — a plan built around your life, not someone else's template.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="btn bg-sage hover:bg-[#4a7232] text-white btn-lg w-full sm:w-auto border-none shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="btn bg-transparent border border-white/20 text-white hover:bg-white/10 btn-lg w-full sm:w-auto transition-colors"
              >
                Log in
              </Link>
            </div>
            <p className="mt-8 text-xs font-mono text-white/30 tracking-wide uppercase">
              Strava connected · Coros + Garmin coming soon
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16">

          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
                  <img
                    src="/KorsanaLogo.jpg"
                    alt="Korsana"
                    className="w-6 h-6 rounded"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  />
                  <span className="text-white font-bold text-sm hidden">K</span>
                </div>
                <span className="text-navy text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Korsana
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                AI-powered running coach that turns your Strava data into a personalized training plan — then adapts it as you go.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-4">Product</p>
              <div className="space-y-3">
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="block text-sm text-text-secondary hover:text-navy transition-colors cursor-pointer"
                >
                  Features
                </button>
                <button
                  onClick={() => document.getElementById('coach')?.scrollIntoView({ behavior: 'smooth' })}
                  className="block text-sm text-text-secondary hover:text-navy transition-colors cursor-pointer"
                >
                  How it works
                </button>
                <Link to="/signup" className="block text-sm text-text-secondary hover:text-navy transition-colors no-underline">
                  Sign up
                </Link>
                <Link to="/login" className="block text-sm text-text-secondary hover:text-navy transition-colors no-underline">
                  Log in
                </Link>
              </div>
            </div>

            {/* Integrations */}
            <div>
              <p className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-4">Integrations</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#FC4C02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
                  <span className="text-sm text-text-secondary">Strava</span>
                  <span className="text-[10px] font-mono font-bold text-sage ml-auto">Live</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#007CC3"><path d="M11.967 0L19.5 4.35V13.05L11.967 17.4L4.433 13.05V4.35L11.967 0ZM11.967 2.053L6.2 5.38V12.033L11.967 15.36L17.734 12.033V5.38L11.967 2.053Z" /></svg>
                  <span className="text-sm text-text-secondary">Garmin</span>
                  <span className="text-[10px] font-mono font-bold text-amber ml-auto">Soon</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12a4 4 0 0 1 8 0" /></svg>
                  <span className="text-sm text-text-secondary">Coros</span>
                  <span className="text-[10px] font-mono font-bold text-amber ml-auto">Soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border-light text-xs text-text-muted font-mono gap-4">
            <p>&copy; {new Date().getFullYear()} Korsana Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="#" className="text-text-muted hover:text-navy transition-colors no-underline">Privacy Policy</Link>
              <Link to="#" className="text-text-muted hover:text-navy transition-colors no-underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
