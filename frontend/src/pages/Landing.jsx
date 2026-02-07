import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedNumber from '../components/AnimatedNumber';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';

// Reusable scroll reveal component
const ScrollReveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
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

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Text reveal animation variants
  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  const titleWords = "Train with purpose.".split(' ');
  const subtitleWords = "Race with confidence.".split(' ');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
      {/* Navigation */}
      <motion.nav
        className="nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.95)' }}
      >
        <Link to="/" className="nav-brand">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            Korsana
          </motion.span>
        </Link>
        <div className="nav-links">
          {!user ? (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <Link to="/login" className="nav-link">Log in</Link>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
                <AnimatedButton variant="primary" onClick={() => window.location.href = '/signup'}>
                  Get Started
                </AnimatedButton>
              </motion.div>
            </>
          ) : (
            <AnimatedButton variant="primary" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </AnimatedButton>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main>
        <section
          ref={heroRef}
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '8rem 1.5rem 6rem',
            textAlign: 'center',
            position: 'relative',
            minHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Subtle background texture */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(36, 46, 123, 0.03) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            left: '10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(97, 139, 74, 0.03) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            pointerEvents: 'none',
          }} />

          <motion.div style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              fontWeight: '900',
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
              lineHeight: '1.1',
            }}>
              {titleWords.map((word, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  style={{ display: 'inline-block', marginRight: '0.3em' }}
                >
                  {word}
                </motion.span>
              ))}
              <br />
              {subtitleWords.map((word, i) => (
                <motion.span
                  key={i}
                  custom={titleWords.length + i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  style={{ display: 'inline-block', marginRight: '0.3em', color: 'var(--color-secondary)' }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{
                fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
                color: 'var(--color-text-secondary)',
                maxWidth: '700px',
                margin: '0 auto 3rem',
                lineHeight: '1.6',
              }}
            >
              Korsana analyzes your training data to build a personalized plan for your race goals. No guesswork. Just results.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <AnimatedButton
                variant="primary"
                onClick={() => window.location.href = '/signup'}
                style={{ padding: '1rem 2.5rem', fontSize: '1.0625rem', fontWeight: 600 }}
              >
                Start Training Free
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '1rem 2.5rem', fontSize: '1.0625rem' }}
              >
                See How It Works
              </AnimatedButton>
            </motion.div>

            {/* Social proof stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              style={{
                display: 'flex',
                gap: '3rem',
                justifyContent: 'center',
                marginTop: '5rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div className="data-value-lg" style={{ color: 'var(--color-primary)', fontSize: '2.5rem' }}>
                  <AnimatedNumber value={500} />+
                </div>
                <div className="label" style={{ marginTop: '0.25rem' }}>RUNNERS</div>
              </div>
              <div>
                <div className="data-value-lg" style={{ color: 'var(--color-secondary)', fontSize: '2.5rem' }}>
                  <AnimatedNumber value={50} />+
                </div>
                <div className="label" style={{ marginTop: '0.25rem' }}>RACES</div>
              </div>
              <div>
                <div className="data-value-lg" style={{ color: 'var(--color-accent)', fontSize: '2.5rem' }}>
                  <AnimatedNumber value={10000} />+
                </div>
                <div className="label" style={{ marginTop: '0.25rem' }}>MILES TRACKED</div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          style={{
            background: 'var(--color-bg-secondary)',
            padding: '6rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1rem' }}>
                  How It Works
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
                  Three simple steps to personalized race training
                </p>
              </div>
            </ScrollReveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginTop: '3rem' }}>
              {[
                {
                  step: '01',
                  title: 'Connect Your Data',
                  description: 'Link your Strava account to import your training history and ongoing activities.',
                  color: 'var(--color-primary)',
                  iconType: 'link',
                },
                {
                  step: '02',
                  title: 'Set Your Race Goal',
                  description: 'Tell us your race date, distance, and target time. We will build around it.',
                  color: 'var(--color-secondary)',
                  iconType: 'goal',
                },
                {
                  step: '03',
                  title: 'Get AI Coaching',
                  description: 'Receive daily insights, pace guidance, and training adjustments based on your data.',
                  color: 'var(--color-accent)',
                  iconType: 'chat',
                },
              ].map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.15}>
                  <motion.div
                    whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.12)' }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: '#fff',
                      padding: '2.5rem 2rem',
                      borderRadius: '0.75rem',
                      border: `2px solid ${item.color}20`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative',
                    }}
                  >
                    {/* Icon based on type */}
                    <div style={{
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '80px',
                      height: '80px',
                      borderRadius: '0.5rem',
                      background: `${item.color}`,
                      position: 'relative',
                    }}>
                      {item.iconType === 'link' && (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                      {item.iconType === 'goal' && (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M2 12h20" />
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                      )}
                      {item.iconType === 'chat' && (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          <line x1="9" y1="10" x2="15" y2="10" />
                          <line x1="9" y1="14" x2="13" y2="14" />
                        </svg>
                      )}
                    </div>
                    <div className="label" style={{ color: item.color, marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                      STEP {item.step}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                      {item.description}
                    </p>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section style={{ padding: '6rem 1.5rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '1rem' }}>
                  Everything You Need to Succeed
                </h2>
              </div>
            </ScrollReveal>

            <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {[
                { label: 'GOAL-DRIVEN', title: 'Every run has a purpose', desc: 'Set your race and target time. Your training plan adapts to get you there.' },
                { label: 'DATA-FIRST', title: 'Know exactly where you stand', desc: 'Real-time dashboard shows pace, mileage, and progress. No fluff.' },
                { label: 'AI COACHING', title: 'Smart adjustments, daily', desc: 'Get personalized advice based on your actual training—not generic tips.' },
              ].map((feature, i) => (
                <StaggerItem key={i}>
                  <ScrollReveal delay={i * 0.1}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      style={{
                        padding: '2rem',
                        background: '#fff',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div className="label" style={{ marginBottom: '0.75rem', color: 'var(--color-secondary)' }}>
                        {feature.label}
                      </div>
                      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{feature.title}</h3>
                      <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                        {feature.desc}
                      </p>
                    </motion.div>
                  </ScrollReveal>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* CTA */}
        <ScrollReveal>
          <section style={{
            padding: '5rem 1.5rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #242E7B 0%, #13230B 100%)',
            color: 'var(--color-text-inverse)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(97, 139, 74, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(80px)',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ marginBottom: '1rem', color: 'inherit', fontSize: 'clamp(1.875rem, 4vw, 2.5rem)' }}>
                Ready to train smarter?
              </h2>
              <p style={{ marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem', fontSize: '1.125rem', lineHeight: '1.6' }}>
                Connect your Strava, set your goal, and let Korsana guide you to the finish line.
              </p>
              <AnimatedButton
                variant="primary"
                onClick={() => window.location.href = '/signup'}
                style={{
                  background: 'var(--color-text-inverse)',
                  color: 'var(--color-primary)',
                  padding: '1.125rem 3rem',
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                Get Started — It's Free
              </AnimatedButton>
            </div>
          </section>
        </ScrollReveal>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '3rem 1.5rem',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.875rem',
        background: 'var(--color-bg-secondary)',
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.125rem' }}>Korsana</span>
        </div>
        <p>Built for the Miami Marathon 2026</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Home</Link>
          <Link to="/login" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Log in</Link>
          <Link to="/signup" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
