import { Link } from 'react-router-dom';

const TermsOfService = () => (
  <div className="min-h-screen bg-bg-app px-6 py-16 flex flex-col items-center">
    <div className="w-full max-w-[720px]">
      <Link to="/" className="text-navy text-sm font-medium no-underline hover:underline mb-8 inline-block">
        ← Back to Korsana
      </Link>
      <h1 className="text-3xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
        Terms of Service
      </h1>
      <p className="text-text-muted text-sm mb-10">Last updated: February 2026</p>
      <div className="bg-white rounded-2xl border border-border-light p-10 text-text-secondary text-sm leading-relaxed">
        <p>Terms of Service content coming soon.</p>
      </div>
    </div>
  </div>
);

export default TermsOfService;
