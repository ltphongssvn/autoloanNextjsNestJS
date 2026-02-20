// apps/frontend/src/components/Navigation.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from './Navigation';

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Navigation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should show public links when not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Navigation />);
    expect(screen.getByText('AutoLoan')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('should show authenticated links when logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, full_name: 'John Doe', role: 'customer' },
      logout: vi.fn(),
    });
    render(<Navigation />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('New Application')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByTestId('nav-user')).toHaveTextContent('John Doe');
  });

  it('should hide New Application for staff', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, full_name: 'Officer', role: 'loan_officer' },
      logout: vi.fn(),
    });
    render(<Navigation />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('New Application')).toBeNull();
  });

  it('should call logout on button click', () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 1, full_name: 'John', role: 'customer' },
      logout: mockLogout,
    });
    render(<Navigation />);
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
