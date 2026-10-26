import { Component } from 'react';
import type { ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly error: Error | null;
}

/**
 * Replaces the whole calculator with a plain warning if anything throws while
 * rendering, including the model rejecting an invalid number. A broken
 * calculator must show nothing it could be mistaken for a result.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error('Unknown error') };
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="crash" role="alert">
        <h1 className="crash__title">Calculation error. Do not use any figure from this page.</h1>
        <p>
          Reload the page and enter the loading again. If this repeats, work the weight and balance
          from the handbook.
        </p>
        <pre className="crash__detail">{error.message}</pre>
      </div>
    );
  }
}
