import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
const mockGetApp = vi.fn();
const mockUpdate = vi.fn();
const mockSubmit = vi.fn();
const mockCreate = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => key === 'edit' ? '5' : null }),
}));

vi.mock('../../../../services/api', () => ({
  api: {
    applications: {
      get: (...args: unknown[]) => mockGetApp(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      submit: (...args: unknown[]) => mockSubmit(...args),
    },
  },
}));

import NewApplicationPage from './page';

describe('NewApplicationPage edit mode', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('loads existing application and pre-fills fields', async () => {
    mockGetApp.mockResolvedValue({
      data: {
        id: 5, current_step: 1, loan_term: 36,
        personal_info: { first_name: 'Jane', last_name: 'Smith' },
        car_details: { make: 'Honda' },
        loan_details: { amount: '20000' },
        employment_info: { employer: 'Acme' },
      },
    });
    render(<NewApplicationPage />);
    await waitFor(() => expect(mockGetApp).toHaveBeenCalledWith(5));
    await waitFor(() => expect((screen.getByLabelText(/First Name/) as HTMLInputElement).value).toBe('Jane'));
  });

  it('shows Edit Application title', async () => {
    mockGetApp.mockResolvedValue({ data: { id: 5, current_step: 1, personal_info: {}, car_details: {}, loan_details: {}, employment_info: {} } });
    render(<NewApplicationPage />);
    await waitFor(() => expect(screen.getByText('Edit Application')).toBeInTheDocument());
  });

  it('pre-fills step from loaded app', async () => {
    mockGetApp.mockResolvedValue({ data: { id: 5, current_step: 3, personal_info: {}, car_details: {}, loan_details: { amount: '15000' }, employment_info: {} } });
    render(<NewApplicationPage />);
    await waitFor(() => expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 3 of 5'));
  });

  it('sets loan term from loaded app', async () => {
    mockGetApp.mockResolvedValue({ data: { id: 5, current_step: 5, loan_term: 60, personal_info: {}, car_details: {}, loan_details: { amount: '20000', down_payment: '5000' }, employment_info: {} } });
    render(<NewApplicationPage />);
    await waitFor(() => expect(screen.getByTestId('term-60')).toHaveClass('border-blue-600'));
  });

  it('handles load error', async () => {
    mockGetApp.mockRejectedValue(new Error('Not found'));
    render(<NewApplicationPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not found'));
  });

  it('handles load error non-Error type', async () => {
    mockGetApp.mockRejectedValue('oops');
    render(<NewApplicationPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load application'));
  });

  it('updates existing app on save draft', async () => {
    mockGetApp.mockResolvedValue({ data: { id: 5, current_step: 1, personal_info: { first_name: 'Jane' }, car_details: {}, loan_details: {}, employment_info: {} } });
    mockUpdate.mockResolvedValue({});
    render(<NewApplicationPage />);
    await waitFor(() => expect(mockGetApp).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(5, expect.any(Object)));
  });

  it('updates then submits existing app', async () => {
    mockGetApp.mockResolvedValue({ data: { id: 5, current_step: 5, personal_info: {}, car_details: {}, loan_details: { amount: '10000' }, employment_info: {} } });
    mockUpdate.mockResolvedValue({});
    mockSubmit.mockResolvedValue({});
    render(<NewApplicationPage />);
    await waitFor(() => expect(screen.getByTestId('step-review')).toBeInTheDocument());
    fireEvent.click(screen.getByText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(5, expect.any(Object)));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(5));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/5'));
  });

  it('handles unwrapped response', async () => {
    mockGetApp.mockResolvedValue({ id: 5, current_step: 2, personal_info: {}, car_details: { make: 'Ford' }, loan_details: {}, employment_info: {} });
    render(<NewApplicationPage />);
    await waitFor(() => expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2 of 5'));
  });

  it('handles missing loan_term gracefully', async () => {
    mockGetApp.mockResolvedValue({ data: { id: 5, current_step: 1, loan_term: null, personal_info: {}, car_details: {}, loan_details: {}, employment_info: {} } });
    render(<NewApplicationPage />);
    await waitFor(() => expect(mockGetApp).toHaveBeenCalled());
    // Default term stays 48
  });
});
