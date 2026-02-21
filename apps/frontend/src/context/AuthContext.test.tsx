// apps/frontend/src/context/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockMe = vi.fn();

vi.mock('../services/api', () => ({
  api: {
    auth: { login: (...args: unknown[]) => mockLogin(...args), signup: (...args: unknown[]) => mockSignup(...args) },
    users: { me: () => mockMe() },
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
    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() });
  });

  it('starts with no user', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('restores user from localStorage', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key === 'token') return 'stored-token'; // pragma: allowlist secret
        if (key === 'user') return JSON.stringify({ id: 1, email: 'stored@test.com' });
        return null;
      }),
      setItem: vi.fn(), removeItem: vi.fn(),
    });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('stored@test.com'));
  });

  it('login with res.data.token shape', async () => {
    mockLogin.mockResolvedValue({ data: { token: 'jwt', user: { id: 1, email: 'a@b.com', role: 'customer', first_name: 'A', last_name: 'B', phone: null, full_name: 'A B', created_at: '' } } }); // pragma: allowlist secret
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('login').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('a@b.com'));
  });

  it('login with res.token shape (no res.data)', async () => {
    mockLogin.mockResolvedValue({ token: 'jwt' }); // pragma: allowlist secret
    mockMe.mockResolvedValue({ id: 2, email: 'flat@b.com', role: 'customer', first_name: 'F', last_name: 'L', phone: null, full_name: 'F L', created_at: '' });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('login').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('flat@b.com'));
    expect(mockMe).toHaveBeenCalled();
  });

  it('login fetches user via me() when no user in response', async () => {
    mockLogin.mockResolvedValue({ data: { token: 'jwt' } }); // pragma: allowlist secret
    mockMe.mockResolvedValue({ data: { id: 3, email: 'me@b.com', role: 'customer', first_name: 'M', last_name: 'E', phone: null, full_name: 'M E', created_at: '' } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('login').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('me@b.com'));
  });

  it('signup with res.data.token shape', async () => {
    mockSignup.mockResolvedValue({ data: { token: 'jwt', user: { id: 4, email: 'new@b.com', role: 'customer', first_name: 'N', last_name: 'W', phone: null, full_name: 'N W', created_at: '' } } }); // pragma: allowlist secret
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('signup').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('new@b.com'));
  });

  it('signup with res.token shape (no res.data)', async () => {
    mockSignup.mockResolvedValue({ token: 'jwt' }); // pragma: allowlist secret
    mockMe.mockResolvedValue({ id: 5, email: 'signflat@b.com', role: 'customer', first_name: 'S', last_name: 'F', phone: null, full_name: 'S F', created_at: '' });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('signup').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('signflat@b.com'));
  });

  it('signup fetches user via me() with data wrapper', async () => {
    mockSignup.mockResolvedValue({ data: { token: 'jwt' } }); // pragma: allowlist secret
    mockMe.mockResolvedValue({ data: { id: 6, email: 'signme@b.com', role: 'customer', first_name: 'SM', last_name: 'E', phone: null, full_name: 'SM E', created_at: '' } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('signup').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('signme@b.com'));
  });

  it('logout clears state', async () => {
    mockLogin.mockResolvedValue({ data: { token: 'jwt', user: { id: 1, email: 'a@b.com', role: 'customer', first_name: 'A', last_name: 'B', phone: null, full_name: 'A B', created_at: '' } } }); // pragma: allowlist secret
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));
    await act(async () => { screen.getByTestId('login').click(); });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('a@b.com'));
    await act(async () => { screen.getByTestId('logout').click(); });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('throws when useAuth used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
