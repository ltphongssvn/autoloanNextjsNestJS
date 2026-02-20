// apps/frontend/src/app/dashboard/applications/new/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewApplicationPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCreate = vi.fn();
vi.mock('../../../../services/api', () => ({
  api: {
    applications: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

const fillForm = () => {
  fireEvent.change(screen.getByLabelText('Loan Amount ($)'), { target: { value: '25000' } });
  fireEvent.change(screen.getByLabelText('Down Payment ($)'), { target: { value: '5000' } });
  fireEvent.change(screen.getByLabelText('Loan Term (months)'), { target: { value: '60' } });
};

describe('NewApplicationPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should render form fields', () => {
    render(<NewApplicationPage />);
    expect(screen.getByRole('heading', { name: 'New Loan Application' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loan Amount ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Down Payment ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Loan Term (months)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeInTheDocument();
  });

  it('should submit and redirect on success', async () => {
    mockCreate.mockResolvedValue({ data: { id: 42 } });
    render(<NewApplicationPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ loanAmount: 25000, downPayment: 5000, loanTerm: 60 });
      expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/42');
    });
  });

  it('should show error on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Validation failed'));
    render(<NewApplicationPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
  });

  it('should handle non-Error failure', async () => {
    mockCreate.mockRejectedValue('unknown');
    render(<NewApplicationPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to create application'));
  });

  it('should disable button while submitting', async () => {
    let resolve: () => void;
    mockCreate.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    render(<NewApplicationPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Application' }));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Submitting...'));
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
