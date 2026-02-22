import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar variant="landing" />

      {/* Hero */}
      <section className="bg-white border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-text-primary mb-6"
                style={{ fontFamily: 'var(--font-serif, var(--font-heading))' }}
              >
                Your <span className="text-navy">plan</span>, our <span className="text-coral">goal</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-text-secondary mb-8 leading-relaxed"
              >
                Korsana connects to your Strava data and builds a personalized training plan
                for your next race. AI coaching that adapts to how you actually run.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link to="/signup" className="btn btn-coral btn-lg">
                  Start Training Free
                </Link>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn btn-outline btn-lg"
                >
                  See How It Works
                </button>
              </motion.div>
            </div>

            {/* Right: Dashboard preview card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="bg-bg-app rounded-2xl border border-border p-6 shadow-lg">
                {/* Mini dashboard mockup */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-3 h-3 rounded-full bg-coral" />
                  <div className="w-3 h-3 rounded-full bg-amber" />
                  <div className="w-3 h-3 rounded-full bg-sage" />
                </div>
                {/* Goal bar */}
                <div className="bg-white rounded-lg border border-border-light p-4 mb-4" style={{ borderLeft: '3px solid var(--color-navy)' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Active Goal</span>
                      <p className="font-semibold text-text-primary mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>Miami Marathon</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>16</span>
                      <span className="text-sm text-text-secondary ml-1">weeks</span>
                    </div>
                  </div>
                </div>
                {/* Metric pills */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Weekly', value: '22.4 mi' },
                    { label: 'Pace', value: '9:12/mi' },
                    { label: 'Ready', value: '78%' },
                  ].map((m) => (
                    <div key={m.label} className="bg-white rounded-lg border border-border-light p-3 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">{m.label}</span>
                      <span className="text-sm font-bold text-text-primary block mt-1" style={{ fontFamily: 'var(--font-mono)' }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                {/* Chart bars */}
                <div className="bg-white rounded-lg border border-border-light p-4">
                  <div className="flex items-end gap-2 h-20">
                    {[35, 55, 42, 68, 50, 75, 60, 85].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.4, delay: 0.4 + i * 0.05 }}
                        className="flex-1 rounded-t bg-navy/80"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-8 mt-12 pt-8 border-t border-border-light"
          >
            {[
              { value: '10,000+', label: 'Miles Tracked' },
              { value: '2,500+', label: 'Athletes' },
              { value: '98%', label: 'PR Rate' },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{stat.value}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider ml-2">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works — deep blue gradient */}
      <section id="how-it-works" className="py-16 md:py-20 bg-navy">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Three steps to race day
            </h2>
            <p className="text-white/70 text-lg">From data to finish line — no guesswork.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Strava',
                desc: 'Import your running history with one click. We analyze your fitness baseline.',
              },
              {
                step: '02',
                title: 'Set Race Goal',
                desc: 'Pick your race, date, distance, and target time. We build the plan.',
              },
              {
                step: '03',
                title: 'Train with AI Coach',
                desc: 'Follow daily workouts with AI coaching that adapts to your progress.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-6 md:p-8"
              >
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-5">
                  <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{item.title}</h3>
                <p className="text-white/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white border-y border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Adaptive Plans',
                desc: 'Miss a run or crush a workout? Your plan adjusts automatically.',
              },
              {
                title: 'Data-Driven Pace',
                desc: 'Targets based on your actual fitness, not a generic chart.',
              },
              {
                title: 'Zero Distractions',
                desc: 'No social feed. Just you, your data, and your goal.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center px-4"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Your Goal, Our Plan.
          </h2>
          <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
            Join runners who train smarter with AI-powered coaching tailored to their race.
          </p>
          <Link to="/signup" className="btn btn-coral btn-lg">
            Start Training Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy py-12 border-t border-navy-light">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">K</span>
                </div>
                <span className="text-white font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Korsana</span>
              </div>
              <span className="text-white/60 text-sm mt-1">Your plan, our goal.</span>
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <Link to="/" className="hover:text-white transition-colors no-underline">Home</Link>
              <Link to="/login" className="hover:text-white transition-colors no-underline">Login</Link>
              <span>&copy; 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
