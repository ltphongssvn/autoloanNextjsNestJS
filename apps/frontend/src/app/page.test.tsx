// apps/frontend/src/app/page.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('should render hero section', () => {
    render(<HomePage />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AutoLoan Application Platform');
  });

  it('should render CTA links', () => {
    render(<HomePage />);
    expect(screen.getByTestId('cta-login')).toHaveAttribute('href', '/login');
    expect(screen.getByTestId('cta-signup')).toHaveAttribute('href', '/signup');
  });

  it('should render features section', () => {
    render(<HomePage />);
    expect(screen.getByTestId('features')).toBeInTheDocument();
    expect(screen.getAllByTestId('feature-item')).toHaveLength(3);
  });

  it('should display feature titles', () => {
    render(<HomePage />);
    expect(screen.getByText('Quick Application')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Tracking')).toBeInTheDocument();
    expect(screen.getByText('Secure & Private')).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Why Choose AutoLoan?' })).toBeInTheDocument();
  });
});
