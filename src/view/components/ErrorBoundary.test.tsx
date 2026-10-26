import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Explodes(): never {
  throw new RangeError('fuelGallons must be a finite number of zero or more, got NaN');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('replaces the page with a warning and the reason when a child throws', () => {
    // React logs the caught error to the console; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <p>a figure that must not appear</p>
        <Explodes />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/do not use any figure/i);
    expect(screen.getByText(/got NaN/)).toBeInTheDocument();
    expect(screen.queryByText('a figure that must not appear')).not.toBeInTheDocument();
  });
});
