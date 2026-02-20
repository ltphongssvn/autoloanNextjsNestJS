// apps/frontend/src/components/ErrorBoundary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <div data-testid="child">OK</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

  it('should render children when no error', () => {
    render(<ErrorBoundary><ThrowingChild shouldThrow={false} /></ErrorBoundary>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    render(<ErrorBoundary><ThrowingChild shouldThrow={true} /></ErrorBoundary>);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom</div>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('should reset on Try Again click', () => {
    let shouldThrow = true;
    function Child() {
      if (shouldThrow) throw new Error('Boom');
      return <div data-testid="child">Recovered</div>;
    }
    render(<ErrorBoundary><Child /></ErrorBoundary>);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByTestId('child')).toHaveTextContent('Recovered');
  });

  it('should show default message for error without message', () => {
    function Child() { throw Object.assign(new Error(), { message: '' }); }
    render(<ErrorBoundary><Child /></ErrorBoundary>);
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});
