// apps/frontend/src/app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';
import RootLayout from './layout';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('RootLayout', () => {
  it('should be a function component', () => {
    expect(typeof RootLayout).toBe('function');
  });

  it('should return html element with lang="en"', () => {
    const child = <div data-testid="child">Test Child</div>;
    const result = RootLayout({ children: child }) as React.ReactElement;
    expect(result.type).toBe('html');
    expect(result.props.lang).toBe('en');
  });

  it('should render children inside body via AuthProvider', () => {
    const child = <div data-testid="child">Test Child</div>;
    const result = RootLayout({ children: child }) as React.ReactElement;
    const body = result.props.children;
    expect(body.type).toBe('body');
    const authProvider = body.props.children;
    expect(authProvider.props.children).toBe(child);
  });

  it('should include font variables on body', () => {
    const result = RootLayout({ children: <div /> }) as React.ReactElement;
    const body = result.props.children;
    expect(body.props.className).toContain('--font-geist-sans');
    expect(body.props.className).toContain('--font-geist-mono');
  });
});
