import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Navigation */}
      <nav className="nav">
        <Link to="/" className="nav-brand">
          Korsana
        </Link>
        <div className="nav-links">
          {!user ? (
            <>
              <Link to="/login" className="nav-link">Log in</Link>
              <Link to="/signup" className="btn btn-primary" style={{ marginLeft: '0.5rem' }}>
                Get Started
              </Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '6rem 1.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '900',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            lineHeight: '1.1'
          }}>
            Train with purpose.<br />
            <span style={{ color: 'var(--color-secondary)' }}>Race with confidence.</span>
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.6'
          }}>
            Korsana analyzes your training data to build a personalized plan for your race goals. No guesswork. Just results.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
              Start Training Free
            </Link>
            <button className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
              See How It Works
            </button>
          </div>
        </section>

        {/* Value Props */}
        <section style={{
          background: 'var(--color-bg-secondary)',
          padding: '4rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}>
              <div>
                <div className="label" style={{ marginBottom: '0.75rem', color: 'var(--color-secondary)' }}>
                  GOAL-DRIVEN
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>Every run has a purpose</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  Set your race and target time. Your training plan adapts to get you there.
                </p>
              </div>

              <div>
                <div className="label" style={{ marginBottom: '0.75rem', color: 'var(--color-secondary)' }}>
                  DATA-FIRST
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>Know exactly where you stand</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  Real-time dashboard shows pace, mileage, and progress. No fluff.
                </p>
              </div>

              <div>
                <div className="label" style={{ marginBottom: '0.75rem', color: 'var(--color-secondary)' }}>
                  AI COACHING
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>Smart adjustments, daily</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  Get personalized advice based on your actual training—not generic tips.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Dashboard Preview */}
        <section style={{ padding: '4rem 1.5rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card card-elevated" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Race Header */}
              <div className="race-header">
                <div className="race-name">UPCOMING RACE</div>
                <div className="race-countdown">Miami Marathon — 16 weeks, 2 days</div>
                <div className="progress-bar" style={{ height: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: '35%' }}></div>
                </div>
              </div>

              {/* Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderBottom: '1px solid var(--color-border)'
              }}>
                <div style={{ padding: '1.5rem', borderRight: '1px solid var(--color-border)' }}>
                  <div className="label">This Week</div>
                  <div className="data-value-lg" style={{ color: 'var(--color-primary)', marginTop: '0.5rem' }}>
                    42<span style={{ fontSize: '1.25rem', marginLeft: '0.25rem' }}>mi</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    of 45 mi planned
                  </div>
                </div>

                <div style={{ padding: '1.5rem', borderRight: '1px solid var(--color-border)' }}>
                  <div className="label">Avg Pace</div>
                  <div className="data-value-lg" style={{ color: 'var(--color-primary)', marginTop: '0.5rem' }}>
                    8:47
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    min/mile
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  <div className="label">Goal Pace</div>
                  <div className="data-value-lg" style={{ color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
                    8:35
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    min/mile
                  </div>
                </div>
              </div>

              {/* Coach Insight */}
              <div style={{ padding: '1.5rem' }}>
                <div className="coach-insight" style={{ margin: 0 }}>
                  <div className="coach-label">
                    <span>💬</span> Coach Insight
                  </div>
                  <p>
                    "Your weekly mileage is on track. Focus on your tempo run this Thursday—it's key for building race-pace confidence."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{
          padding: '4rem 1.5rem',
          textAlign: 'center',
          background: 'var(--color-primary)',
          color: 'var(--color-text-inverse)'
        }}>
          <h2 style={{ marginBottom: '1rem', color: 'inherit' }}>Ready to train smarter?</h2>
          <p style={{ marginBottom: '2rem', opacity: 0.8, maxWidth: '500px', margin: '0 auto 2rem' }}>
            Connect your Strava, set your goal, and let Korsana guide you to the finish line.
          </p>
          <Link to="/signup" className="btn" style={{
            background: 'var(--color-text-inverse)',
            color: 'var(--color-primary)',
            padding: '1rem 2rem',
            fontSize: '1rem'
          }}>
            Get Started — It's Free
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem 1.5rem',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.875rem'
      }}>
        Korsana — Built for the Miami Marathon 2026
      </footer>
    </div>
  );
};

export default Landing;
