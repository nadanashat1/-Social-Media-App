import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Catches unexpected render errors so one broken component does not
 * unmount the whole app; offers a reload instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface details in the console for debugging without breaking the UI.
    console.error('Route UI error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
            padding: '2rem 1.5rem',
          }}
        >
          <AlertCircle size={40} color="#DC2626" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: '420px' }}>
            An unexpected error interrupted the page. Reloading usually resolves it.
          </p>
          <button
            type="button"
            className="btn-create-post"
            onClick={this.handleReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.4rem',
              fontSize: '0.88rem',
            }}
          >
            <RefreshCw size={15} />
            <span>Reload Page</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
