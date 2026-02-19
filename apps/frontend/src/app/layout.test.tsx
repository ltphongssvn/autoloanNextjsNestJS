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

  it('should render html element with lang="en"', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );
    const html = container.querySelector('html');
    expect(html).toBeTruthy();
    expect(html?.getAttribute('lang')).toBe('en');
  });

  it('should render body with class containing antialiased and font variables', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );
    const body = container.querySelector('body');
    if (body) {
      expect(body.className).toContain('antialiased');
    } else {
      // In test env, body renders as part of html string inside container
      const html = container.innerHTML;
      expect(html).toContain('antialiased');
      expect(html).toContain('--font-geist-sans');
      expect(html).toContain('--font-geist-mono');
    }
  });
});
