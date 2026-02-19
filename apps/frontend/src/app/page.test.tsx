// apps/frontend/src/app/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

describe('Home', () => {
  it('should render the Next.js logo', () => {
    render(<Home />);
    const logo = screen.getByAltText('Next.js logo');
    expect(logo).toBeInTheDocument();
  });

  it('should render the heading', () => {
    render(<Home />);
    expect(
      screen.getByText(/to get started, edit the page\.tsx file/i)
    ).toBeInTheDocument();
  });

  it('should render Deploy Now link', () => {
    render(<Home />);
    expect(screen.getByText('Deploy Now')).toBeInTheDocument();
  });

  it('should render Documentation link', () => {
    render(<Home />);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('should have correct external link targets', () => {
    render(<Home />);
    const deployLink = screen.getByText('Deploy Now').closest('a');
    const docsLink = screen.getByText('Documentation').closest('a');
    expect(deployLink).toHaveAttribute('target', '_blank');
    expect(deployLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
