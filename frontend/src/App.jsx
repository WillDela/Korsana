import { useState } from 'react'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
              <span className="text-xl">🏃</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">AllInRun</h1>
          </div>

          <div className="flex gap-4">
            {!isLoggedIn ? (
              <>
                <button className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
                  Log In
                </button>
                <button className="btn-primary">
                  Get Started
                </button>
              </>
            ) : (
              <button className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
                Dashboard
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <section className="min-h-[80vh] flex flex-col justify-center items-center text-center">
            <div className="animate-float mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center animate-pulse-glow">
                <span className="text-6xl">🏃</span>
              </div>
            </div>

            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              Your Personal
              <span className="gradient-text block">AI Running Coach</span>
            </h2>

            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mb-8">
              AllInRun analyzes your training data to create and adapt a personalized plan
              for your specific race goals. Get race-ready with AI-powered coaching.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button className="btn-primary text-lg px-8 py-4">
                Start Training Free
              </button>
              <button className="glass px-8 py-4 rounded-lg text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-all">
                Connect Strava
              </button>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
              <div className="card text-left">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Goal-Driven</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Set your race and target time. Every feature is designed to get you there.
                </p>
              </div>

              <div className="card text-left">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Race Readiness</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Real-time dashboard showing if you're on track for race day.
                </p>
              </div>

              <div className="card text-left">
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-2">AI Coach</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Get personalized advice based on your training and goals.
                </p>
              </div>
            </div>
          </section>

          {/* Race Countdown Preview */}
          <section className="py-24">
            <div className="card max-w-2xl mx-auto text-center">
              <p className="text-[var(--color-text-secondary)] mb-2">Your Next Race</p>
              <h3 className="text-3xl font-bold gradient-text mb-4">Miami Marathon 2026</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { value: '7', label: 'Months' },
                  { value: '2', label: 'Weeks' },
                  { value: '3', label: 'Days' },
                  { value: '14', label: 'Hours' },
                ].map((item, i) => (
                  <div key={i} className="glass rounded-lg p-4">
                    <div className="text-3xl font-bold text-[var(--color-primary)]">{item.value}</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">{item.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-[var(--color-text-secondary)]">
                Target: <span className="text-white font-semibold">3:45:00</span>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-[var(--color-text-secondary)]">
          <p>AllInRun — Built for the Miami Marathon 2026 🏃‍♂️</p>
        </div>
      </footer>
    </div>
  )
}

export default App
