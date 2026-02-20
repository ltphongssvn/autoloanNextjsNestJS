// apps/frontend/src/components/LoadingSkeleton.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSkeleton from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('should render with defaults', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-header')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(3);
  });

  it('should render custom row count', () => {
    render(<LoadingSkeleton rows={5} />);
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(5);
  });

  it('should hide header when showHeader is false', () => {
    render(<LoadingSkeleton showHeader={false} />);
    expect(screen.queryByTestId('skeleton-header')).toBeNull();
  });

  it('should have accessible role', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
