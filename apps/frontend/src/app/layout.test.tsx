// apps/frontend/src/app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout from './layout';

describe('RootLayout', () => {
  it('should be a function component', () => {
    expect(typeof RootLayout).toBe('function');
  });

  it('should return html element with lang="en"', () => {
    const result = RootLayout({ children: <div>test</div> });
    expect(result.type).toBe('html');
    expect(result.props.lang).toBe('en');
  });

  it('should render children inside body', () => {
    const child = <div data-testid="child">Test Child</div>;
    const result = RootLayout({ children: child });
    const body = result.props.children;
    expect(body.type).toBe('body');
    expect(body.props.children).toBe(child);
  });

  it('should include antialiased class on body', () => {
    const result = RootLayout({ children: <div>test</div> });
    const body = result.props.children;
    expect(body.props.className).toContain('antialiased');
  });

  it('should include font variables on body', () => {
    const result = RootLayout({ children: <div>test</div> });
    const body = result.props.children;
    expect(body.props.className).toContain('--font-geist-sans');
    expect(body.props.className).toContain('--font-geist-mono');
  });
});
