import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage (LandingPage)', () => {
  it('renders Auto Loan branding', () => {
    render(<HomePage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
  });

  it('renders Login button in navbar', () => {
    render(<HomePage />);
    expect(screen.getByTestId('cta-login')).toHaveTextContent('Login');
  });

  it('renders hero with correct title', () => {
    render(<HomePage />);
    expect(screen.getByText('Get Your Auto Loan in 15 minutes')).toBeInTheDocument();
  });

  it('renders hero subtitle', () => {
    render(<HomePage />);
    expect(screen.getByText(/Fast online approval/)).toBeInTheDocument();
  });

  it('renders Apply Now CTA', () => {
    render(<HomePage />);
    expect(screen.getByTestId('cta-apply')).toHaveTextContent('Apply Now');
  });

  it('renders payment calculator', () => {
    render(<HomePage />);
    expect(screen.getByTestId('payment-calculator')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(<HomePage />);
    expect(screen.getByTestId('features')).toBeInTheDocument();
    expect(screen.getAllByTestId('feature-item')).toHaveLength(3);
  });

  it('renders hero section', () => {
    render(<HomePage />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
  });
});
