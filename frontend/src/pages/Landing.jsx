import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoMasonry from '../components/PhotoMasonry';
import AnimatedNumber from '../components/AnimatedNumber';

// Reusable scroll reveal component
const ScrollReveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const Landing = () => {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="min-h-screen bg-white text-deep-green overflow-hidden font-sans selection:bg-secondary selection:text-white">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            {/* Logo Placeholder (or use actual logo asset if/when available) */}
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:bg-secondary transition-colors duration-300">
              K
            </div>
            <span className="text-xl font-bold tracking-tight text-primary group-hover:text-secondary transition-colors duration-300">
              Korsana
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {!user ? (
              <>
                <Link to="/login" className="hidden md:block text-slate-600 font-medium hover:text-primary transition-colors">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary shadow-lg shadow-secondary/20 hover:shadow-secondary/30"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main>
        <section
          ref={heroRef}
          className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-white texture-topography"
        >
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div style={{ y: heroY }} className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-deep-green">
                    Train with <span className="text-primary italic">purpose</span>.<br />
                    Race with <span className="text-secondary">confidence</span>.
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-lg"
                >
                  Korsana analyzes your training data to build a personalized plan for your specific race goals. No guesswork. Just results.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link to="/signup" className="btn btn-primary text-lg px-8 py-4 h-auto">
                    Start Training Free
                  </Link>
                  <button
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn btn-outline text-lg px-8 py-4 h-auto"
                  >
                    See How It Works
                  </button>
                </motion.div>

                {/* Social Proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 flex items-center gap-4 sm:gap-8 border-t border-gray-100 pt-8"
                >
                  <div>
                    <div className="font-mono text-2xl sm:text-3xl font-bold text-primary tabular-nums tracking-tight">
                      <AnimatedNumber value={500} />+
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Runners</div>
                  </div>
                  <div className="w-px h-10 bg-gray-200"></div>
                  <div>
                    <div className="font-mono text-2xl sm:text-3xl font-bold text-secondary tabular-nums tracking-tight">
                      <AnimatedNumber value={10000} />+
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Miles Tracked</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Hero Visual - Masonry Grid */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 rounded-3xl -z-10 blur-3xl transform rotate-3"></div>
                <PhotoMasonry />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Diagonal Section Divider */}
        <div className="h-16 md:h-32 bg-primary clip-diagonal-bottom -mb-1 relative z-20"></div>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 md:py-32 bg-slate-50 relative z-10">
          <div className="container mx-auto px-6">
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-secondary font-bold tracking-wider uppercase text-sm mb-2 block">The Process</span>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 text-deep-green">Precision Training in 3 Steps</h2>
                <p className="text-slate-600 text-lg">We turn your data into a clear path to the finish line.</p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-10 relative">
              {/* Connection Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-10"></div>

              {[
                {
                  step: '01',
                  title: 'Connect Data',
                  desc: 'Link Strava to import your history.',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  ),
                  color: 'bg-primary'
                },
                {
                  step: '02',
                  title: 'Set Race Goal',
                  desc: 'Input race date, distance, and target time.',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  ),
                  color: 'bg-secondary'
                },
                {
                  step: '03',
                  title: 'Execute Plan',
                  desc: 'Get daily adaptive coaching and pace targets.',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  color: 'bg-accent'
                }
              ].map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.2}>
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-6 shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <div className="font-mono text-sm text-slate-400 mb-2">STEP {item.step}</div>
                    <h3 className="text-xl font-bold mb-3 text-deep-green">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>

                    {/* Hover Effect Line */}
                    <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${item.color}`}></div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* "The Crossing" Section - Deep Blue/Green */}
        <section className="relative py-20 md:py-40 bg-gradient-to-br from-primary via-deep-green to-secondary text-white overflow-hidden">
          {/* Topographic Texture Overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay texture-topography"></div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollReveal>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-8 tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Everything you need</span><br />
                  <span className="text-accent">to cross the line.</span>
                </h2>
                <div className="grid md:grid-cols-3 gap-6 md:gap-10 mt-12 md:mt-20 text-left">
                  <div className="bg-white/10 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <h3 className="font-bold text-xl mb-3 text-accent">Adaptive</h3>
                    <p className="text-white/80 leading-relaxed">Plans that adjust when you miss a run or crush a workout.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <h3 className="font-bold text-xl mb-3 text-accent">Data-Driven</h3>
                    <p className="text-white/80 leading-relaxed">Pace targets based on your actual fitness, not a generic chart.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                    <h3 className="font-bold text-xl mb-3 text-accent">Focused</h3>
                    <p className="text-white/80 leading-relaxed">No social feed distractions. Just you, your data, and your goal.</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary py-16 border-t border-primary/80">
          <div className="container mx-auto px-6 text-center">
            <div className="font-bold text-2xl text-white mb-4 flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-deep-green text-xs font-bold">K</div>
              Korsana
            </div>
            <p className="text-white/70 text-sm mb-8">Built with precision for the Miami Marathon 2026.</p>
            <div className="flex justify-center gap-4 sm:gap-8 text-sm font-medium text-white/80">
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
              <Link to="/login" className="hover:text-accent transition-colors">Login</Link>
              <a href="#" className="hover:text-accent transition-colors">Privacy</a>
              <a href="#" className="hover:text-accent transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
