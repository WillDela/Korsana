import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const name = this.props.name ?? 'Widget';
    console.error(`[${name}] render error`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const name = this.props.name ?? 'Widget';
      return (
        <div className="card flex items-center justify-center gap-2 py-6 text-sm text-text-muted">
          <svg
            width="15" height="15" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="10" cy="10" r="9" />
            <path d="M10 6v5M10 14h.01" />
          </svg>
          {`${name} unavailable`}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
