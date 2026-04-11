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
    console.error(`[${this.props.name ?? 'Widget'}] render error`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card flex items-center justify-center gap-2 py-6 text-sm text-text-muted">
          <svg
            width="15" height="15" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="10" cy="10" r="9" />
            <path d="M10 6v5M10 14h.01" />
          </svg>
          {this.props.name ? `${this.props.name} unavailable` : 'Widget unavailable'}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
