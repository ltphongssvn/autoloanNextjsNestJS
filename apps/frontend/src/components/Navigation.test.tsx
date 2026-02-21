import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Navigation from './Navigation';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
import { useAuth } from '../context/AuthContext';
const mockUseAuth = vi.mocked(useAuth);

const mockAuth = (user: { role: string; full_name: string } | null) =>
  mockUseAuth.mockReturnValue({ user, logout: vi.fn(), loading: false } as ReturnType<typeof useAuth>);

describe('Navigation', () => {
  it('shows login links when not authenticated', () => {
    mockAuth(null);
    render(<Navigation />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('shows customer nav with new application link', () => {
    mockAuth({ role: 'customer', full_name: 'John Doe' });
    render(<Navigation />);
    expect(screen.getByText('New Application')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toHaveAttribute('href', '/dashboard');
  });

  it('shows loan officer nav with correct dashboard link', () => {
    mockAuth({ role: 'loan_officer', full_name: 'Jane LO' });
    render(<Navigation />);
    expect(screen.queryByText('New Application')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toHaveAttribute('href', '/dashboard/loan-officer');
  });

  it('shows underwriter nav with correct dashboard link', () => {
    mockAuth({ role: 'underwriter', full_name: 'Bob UW' });
    render(<Navigation />);
    expect(screen.queryByText('New Application')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toHaveAttribute('href', '/dashboard/underwriter');
  });
});
