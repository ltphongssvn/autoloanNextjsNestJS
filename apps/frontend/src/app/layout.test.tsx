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

vi.mock('../components/Navigation', () => ({
  default: () => <nav data-testid="mock-nav" />,
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

  it('should render body with font variables', () => {
    const result = RootLayout({ children: <div /> }) as React.ReactElement;
    const body = result.props.children;
    expect(body.type).toBe('body');
    expect(body.props.className).toContain('--font-geist-sans');
    expect(body.props.className).toContain('--font-geist-mono');
  });

  it('should wrap children with AuthProvider and Navigation', () => {
    const child = <div data-testid="child">Test</div>;
    const result = RootLayout({ children: child }) as React.ReactElement;
    const body = result.props.children;
    const authChildren = body.props.children;
    const childrenArray = Array.isArray(authChildren.props.children) ? authChildren.props.children : [authChildren.props.children];
    expect(childrenArray).toHaveLength(2);
    expect(childrenArray[1]).toBe(child);
  });
});
