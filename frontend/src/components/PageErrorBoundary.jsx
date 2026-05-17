import { Component } from 'react';

// PageErrorBoundary is the route-level fallback for unrecoverable render
// errors. Distinct from the widget-scoped ErrorBoundary so a broken page
// doesn't render a tiny "Widget unavailable" pill where the whole app used
// to be. Async errors (fetches, handlers) bypass React boundaries entirely
// and are surfaced via the toast system instead.
class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary] render error', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-app flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white rounded-xl border border-border-light p-8 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
              <svg
                width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-xl font-bold font-heading text-navy mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-text-secondary font-sans mb-6">
              The page hit an unexpected error. Reload to try again, or head back to your dashboard.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold text-white bg-coral hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none"
              >
                Reload page
              </button>
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-navy border border-border bg-white hover:bg-[var(--color-bg-elevated)] no-underline"
              >
                Go to dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;
