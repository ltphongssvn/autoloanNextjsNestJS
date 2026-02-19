// apps/frontend/src/app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout from './layout';

describe('RootLayout', () => {
  it('should render children content', () => {
    render(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <RootLayout>
        <p>First</p>
        <p>Second</p>
      </RootLayout>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('should be a function component that accepts children prop', () => {
    expect(typeof RootLayout).toBe('function');
    const result = RootLayout({ children: <div>test</div> });
    expect(result).toBeTruthy();
    expect(result.type).toBe('html');
    expect(result.props.lang).toBe('en');
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
