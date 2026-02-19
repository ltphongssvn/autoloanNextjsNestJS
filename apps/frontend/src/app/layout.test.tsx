// apps/frontend/src/app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout from './layout';

describe('RootLayout', () => {
  it('should render children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should render html with lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );
    const html = container.closest('html');
    expect(html).toBeTruthy();
  });

  it('should apply font variables and antialiased to body', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );
    const body = container.querySelector('body');
    expect(body?.className).toContain('antialiased');
    expect(body?.className).toContain('--font-geist-sans');
    expect(body?.className).toContain('--font-geist-mono');
  });
});
