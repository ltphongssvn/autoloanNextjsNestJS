// apps/frontend/src/app/not-found.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFoundPage from './not-found';

describe('NotFoundPage', () => {
  it('should render 404 heading', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('heading')).toHaveTextContent('404');
  });

  it('should render description', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('The page you are looking for does not exist.')).toBeInTheDocument();
  });

  it('should link to home', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('Go Home')).toHaveAttribute('href', '/');
  });
});
