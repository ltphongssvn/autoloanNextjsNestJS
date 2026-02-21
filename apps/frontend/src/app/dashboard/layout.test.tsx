import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mockReplace = vi.fn();
const mockPathname = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import DashboardLayout from './layout';

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    localStorage.clear();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'customer' } });
    localStorage.setItem('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiY3VzdG9tZXIifQ.abc');  // pragma: allowlist secret
    const { getByText } = render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(getByText('Child')).toBeInTheDocument();
  });

  it('redirects to login when no token and no user', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/dashboard');
  });

  it('redirects customer away from loan-officer pages', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'customer' } });
    mockPathname.mockReturnValue('/dashboard/loan-officer');
    localStorage.setItem('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiY3VzdG9tZXIifQ.abc');  // pragma: allowlist secret
    render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects underwriter away from loan-officer pages to underwriter dashboard', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'underwriter' } });
    mockPathname.mockReturnValue('/dashboard/loan-officer');
    localStorage.setItem('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidW5kZXJ3cml0ZXIifQ.abc');  // pragma: allowlist secret
    render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/underwriter');
  });

  it('redirects customer away from underwriter pages', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'customer' } });
    mockPathname.mockReturnValue('/dashboard/underwriter');
    localStorage.setItem('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiY3VzdG9tZXIifQ.abc');  // pragma: allowlist secret
    render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects loan_officer away from underwriter pages to loan-officer dashboard', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'loan_officer' } });
    mockPathname.mockReturnValue('/dashboard/underwriter');
    localStorage.setItem('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoibG9hbl9vZmZpY2VyIn0.abc');  // pragma: allowlist secret
    render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/loan-officer');
  });

  it('reads token from cookie when localStorage is empty', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'customer' } });
    Object.defineProperty(document, 'cookie', { writable: true, value: 'token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiY3VzdG9tZXIifQ.abc' }); // pragma: allowlist secret
    const { getByText } = render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(getByText('Child')).toBeInTheDocument();
  });

  it('defaults role to customer when token has no role', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockPathname.mockReturnValue('/dashboard/loan-officer');
    localStorage.setItem('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.e30.abc');  // pragma: allowlist secret
    render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('handles invalid token gracefully', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'customer' } });
    localStorage.setItem('token', 'invalid-token');
    const { getByText } = render(<DashboardLayout><div>Child</div></DashboardLayout>);
    expect(getByText('Child')).toBeInTheDocument();
  });
});
