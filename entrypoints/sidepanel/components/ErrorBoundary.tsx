import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Sidepanel App:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            textAlign: 'center',
            height: '100vh',
            background: '#0d0f14',
            color: '#c9cdd8',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <AlertTriangle size={36} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: '#eceef5' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '12px', color: '#7c8296', margin: '0 0 16px 0', maxWidth: '240px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#4f51b5',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Reload Sidepanel
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
