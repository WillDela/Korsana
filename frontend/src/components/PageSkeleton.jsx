import { Skeleton } from './Skeleton';

// Content-only skeleton for use inside AppLayout while a page fetches its data.
// Mirrors the AppPageHero + MetricStrip + content-block shape used by most pages
// so the layout doesn't shift when real content lands.
export const PageSkeleton = () => (
  <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
    {/* Hero area */}
    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
      <div className="flex-1 min-w-0">
        <Skeleton width="40%" height="1.75rem" className="mb-2" />
        <Skeleton width="60%" height="0.875rem" />
      </div>
      <Skeleton width="120px" height="2.25rem" className="rounded-lg" />
    </div>

    {/* Metric strip */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-border-light">
          <Skeleton width="50%" height="0.625rem" className="mb-3" />
          <Skeleton width="70%" height="1.5rem" />
        </div>
      ))}
    </div>

    {/* Content blocks */}
    <div className="bg-white rounded-xl border border-border-light p-6">
      <Skeleton width="35%" height="1rem" className="mb-4" />
      <div className="space-y-3">
        <Skeleton width="100%" height="0.875rem" />
        <Skeleton width="92%" height="0.875rem" />
        <Skeleton width="78%" height="0.875rem" />
      </div>
    </div>

    <div className="bg-white rounded-xl border border-border-light p-6">
      <Skeleton width="30%" height="1rem" className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton width="100%" height="5rem" />
        <Skeleton width="100%" height="5rem" />
      </div>
    </div>
  </div>
);

// Full-page skeleton for the pre-auth gate (ProtectedRoute). Includes a navbar
// stand-in so users don't see a blank viewport while the session resolves.
export const FullPageSkeleton = () => (
  <div className="min-h-screen bg-bg-app" aria-busy="true" aria-live="polite">
    {/* Navbar stand-in — matches the real navbar's 58px navy bar */}
    <div className="sticky top-0 z-50 border-b border-white/10" style={{ background: '#1B2559', height: 58 }} />
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      <main className="w-full pt-6 pb-16">
        <PageSkeleton />
      </main>
    </div>
  </div>
);

export default PageSkeleton;
