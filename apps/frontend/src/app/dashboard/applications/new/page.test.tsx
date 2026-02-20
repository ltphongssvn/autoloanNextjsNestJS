// apps/frontend/src/app/dashboard/applications/new/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewApplicationPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const mockCreate = vi.fn();
vi.mock('../../../../services/api', () => ({
  api: { applications: { create: (...args: unknown[]) => mockCreate(...args) } },
}));

describe('NewApplicationPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should render step 1 by default', () => {
    render(<NewApplicationPage />);
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1 of 4');
    expect(screen.getByTestId('step-personal')).toBeInTheDocument();
  });

  it('should navigate to step 2', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2 of 4');
    expect(screen.getByTestId('step-vehicle')).toBeInTheDocument();
  });

  it('should navigate to step 3', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 3 of 4');
    expect(screen.getByTestId('step-employment')).toBeInTheDocument();
  });

  it('should navigate to step 4', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 4 of 4');
    expect(screen.getByTestId('step-loan')).toBeInTheDocument();
  });

  it('should go back from step 2', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1 of 4');
  });

  it('should go back from step 3', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2 of 4');
  });

  it('should go back from step 4', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 3 of 4');
  });

  it('should update form fields', () => {
    render(<NewApplicationPage />);
    const dobInput = screen.getByLabelText('Date of Birth');
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    expect(dobInput).toHaveValue('1990-01-01');
  });

  it('should submit application and redirect', async () => {
    mockCreate.mockResolvedValue({ data: { id: 42 } });
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/42'));
  });

  it('should submit with res.id fallback', async () => {
    mockCreate.mockResolvedValue({ id: 99 });
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/99'));
  });

  it('should show error on submit failure', async () => {
    mockCreate.mockRejectedValue(new Error('Validation failed'));
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Validation failed'));
  });

  it('should handle non-Error submit failure', async () => {
    mockCreate.mockRejectedValue('fail');
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to create application'));
  });

  it('should show submitting state', async () => {
    mockCreate.mockReturnValue(new Promise(() => {}));
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit Application'));
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('should update vehicle fields on step 2', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    const makeInput = screen.getByLabelText('Make');
    fireEvent.change(makeInput, { target: { value: 'Toyota' } });
    expect(makeInput).toHaveValue('Toyota');
  });

  it('should update employment fields on step 3', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    const employerInput = screen.getByLabelText('Employer Name');
    fireEvent.change(employerInput, { target: { value: 'Acme Corp' } });
    expect(employerInput).toHaveValue('Acme Corp');
  });

  it('should update loan fields on step 4', () => {
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    const amountInput = screen.getByLabelText('Loan Amount');
    fireEvent.change(amountInput, { target: { value: '25000' } });
    expect(amountInput).toHaveValue(25000);
  });
});
