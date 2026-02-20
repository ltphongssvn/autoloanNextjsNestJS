// apps/frontend/src/app/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props;
    return <img {...rest} alt={(rest.alt as string) || ''} data-priority={priority ? 'true' : 'false'} />; // eslint-disable-line @next/next/no-img-element
  },
}));

describe('Home', () => {
  it('should render the logo', () => {
    render(<Home />);
    expect(screen.getByAltText('Next.js logo')).toBeInTheDocument();
  });

  it('should render the heading', () => {
    render(<Home />);
    expect(screen.getByText(/To get started, edit the page\.tsx file/)).toBeInTheDocument();
  });

  it('should render deploy link', () => {
    render(<Home />);
    expect(screen.getByText('Deploy Now')).toBeInTheDocument();
  });

  it('should have external links with target blank', () => {
    render(<Home />);
    const links = screen.getAllByRole('link');
    const externalLinks = links.filter((l) => l.getAttribute('target') === '_blank');
    expect(externalLinks.length).toBeGreaterThan(0);
  });

  it('should render Vercel logo', () => {
    render(<Home />);
    expect(screen.getByAltText('Vercel logomark')).toBeInTheDocument();
  });
});
