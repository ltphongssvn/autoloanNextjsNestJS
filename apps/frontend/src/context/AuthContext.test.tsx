// apps/frontend/src/context/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/api', () => ({
  api: {
    auth: {
      login: vi.fn().mockResolvedValue({
        data: {
          token: 'mock-jwt-token', // pragma: allowlist secret
          user: { id: 1, email: 'test@test.com', role: 'customer', first_name: 'John', last_name: 'Doe', phone: null, full_name: 'John Doe', created_at: '' },
        },
      }),
      signup: vi.fn().mockResolvedValue({
        data: {
          token: 'mock-jwt-token', // pragma: allowlist secret
          user: { id: 2, email: 'new@test.com', role: 'customer', first_name: 'Jane', last_name: 'Doe', phone: null, full_name: 'Jane Doe', created_at: '' },
        },
      }),
    },
  },
}));

function TestConsumer() {
  const { user, isLoading, login, signup, logout } = useAuth();
  const testPassword = 'testpass'; // pragma: allowlist secret
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user ? user.email : 'none'}</div>
      <button data-testid="login" onClick={() => login('test@test.com', testPassword)}>Login</button>
      <button data-testid="signup" onClick={() => signup({ email: 'new@test.com', password: testPassword })}>Signup</button>
      <button data-testid="logout" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('should start with no user and loading true', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('should restore user from localStorage', async () => {
    const storedUser = JSON.stringify({ id: 1, email: 'stored@test.com' });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key === 'token') return 'stored-token'; // pragma: allowlist secret
        if (key === 'user') return storedUser;
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('stored@test.com'));
  });

  it('should login and update state', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('login').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('test@test.com'));
  });

  it('should signup and update state', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('signup').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('new@test.com'));
  });

  it('should logout and clear state', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('login').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('test@test.com'));
    await act(async () => { screen.getByTestId('logout').click(); });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('should throw when useAuth used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
