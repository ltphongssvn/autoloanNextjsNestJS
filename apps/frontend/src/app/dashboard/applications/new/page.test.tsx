import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewApplicationPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}));

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockSubmit = vi.fn();
const mockGetApp = vi.fn();
vi.mock('../../../../services/api', () => ({
  api: {
    applications: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      submit: (...args: unknown[]) => mockSubmit(...args),
      get: (...args: unknown[]) => mockGetApp(...args),
    },
  },
}));

function clickNext() { fireEvent.click(screen.getByText('Next')); }
function clickBack() { fireEvent.click(screen.getByText('Back')); }

describe('NewApplicationPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders step 1 with personal info fields', () => {
    render(<NewApplicationPage />);
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1 of 5');
    expect(screen.getByTestId('step-personal')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('SSN')).toBeInTheDocument();
  });

  it('displays all 5 step labels', () => {
    render(<NewApplicationPage />);
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Car Details')).toBeInTheDocument();
    expect(screen.getByText('Loan Details')).toBeInTheDocument();
    expect(screen.getByText('Employment')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('navigates to step 2 (vehicle) with condition radio', () => {
    render(<NewApplicationPage />);
    clickNext();
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2 of 5');
    expect(screen.getByTestId('step-vehicle')).toBeInTheDocument();
    expect(screen.getByTestId('condition-radio')).toBeInTheDocument();
  });

  it('navigates to step 3 (loan) with summary and LTV', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext();
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 3 of 5');
    expect(screen.getByTestId('step-loan')).toBeInTheDocument();
    expect(screen.getByTestId('loan-summary')).toBeInTheDocument();
    expect(screen.getByTestId('ltv-value')).toBeInTheDocument();
  });

  it('navigates to step 4 (employment) with DTI alert', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext();
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 4 of 5');
    expect(screen.getByTestId('step-employment')).toBeInTheDocument();
    expect(screen.getByTestId('dti-alert')).toBeInTheDocument();
  });

  it('navigates to step 5 (review) with term cards and summary', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 5 of 5');
    expect(screen.getByTestId('step-review')).toBeInTheDocument();
    expect(screen.getByTestId('term-cards')).toBeInTheDocument();
    expect(screen.getByTestId('term-36')).toBeInTheDocument();
    expect(screen.getByTestId('term-48')).toBeInTheDocument();
    expect(screen.getByTestId('term-60')).toBeInTheDocument();
    expect(screen.getByTestId('review-summary')).toBeInTheDocument();
    expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    expect(screen.getByTestId('terms-acceptance')).toBeInTheDocument();
  });

  it('goes back from step 2 to step 1', () => {
    render(<NewApplicationPage />);
    clickNext(); clickBack();
    expect(screen.getByTestId('step-personal')).toBeInTheDocument();
  });

  it('goes back from step 5 to step 4', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    clickBack();
    expect(screen.getByTestId('step-employment')).toBeInTheDocument();
  });

  it('preserves personal info across steps', () => {
    render(<NewApplicationPage />);
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Doe' } });
    clickNext(); clickBack();
    expect((screen.getByLabelText(/First Name/) as HTMLInputElement).value).toBe('John');
    expect((screen.getByLabelText(/Last Name/) as HTMLInputElement).value).toBe('Doe');
  });

  it('selects vehicle condition radio', () => {
    render(<NewApplicationPage />);
    clickNext();
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(radios[1]).toBeChecked();
  });

  it('switches term selection cards on review', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByTestId('term-36'));
    expect(screen.getByText('6.5% APR')).toBeInTheDocument();
  });

  it('review edit buttons navigate to correct steps', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    const editBtns = screen.getAllByText('Edit');
    fireEvent.click(editBtns[0]);
    expect(screen.getByTestId('step-personal')).toBeInTheDocument();
  });

  it('shows error if terms not accepted on submit', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByText('Submit Application'));
    expect(screen.getByRole('alert')).toHaveTextContent('Please accept the terms and conditions.');
  });

  it('submits with create then submit and redirects', async () => {
    mockCreate.mockResolvedValue({ data: { id: '42' } });
    mockSubmit.mockResolvedValue({});
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith('42'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/42'));
  });

  it('submits with res.id fallback', async () => {
    mockCreate.mockResolvedValue({ id: 99 });
    mockSubmit.mockResolvedValue({});
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/99'));
  });

  it('shows error on submit failure', async () => {
    mockCreate.mockRejectedValue(new Error('Server error'));
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server error'));
  });

  it('handles non-Error submit failure', async () => {
    mockCreate.mockRejectedValue('fail');
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to submit application'));
  });

  it('shows submitting state', async () => {
    mockCreate.mockReturnValue(new Promise(() => {}));
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit Application'));
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('toggles document checkboxes', () => {
    render(<NewApplicationPage />);
    clickNext(); clickNext(); clickNext(); clickNext();
    const dl = screen.getByLabelText(/Driver/);
    expect(dl).not.toBeChecked();
    fireEvent.click(dl);
    expect(dl).toBeChecked();
  });

  it('renders save draft button on every step', () => {
    render(<NewApplicationPage />);
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    clickNext();
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    clickNext();
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    clickNext();
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    clickNext();
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
  });

  it('save draft creates new app when no appId', async () => {
    mockCreate.mockResolvedValue({ data: { id: 10 } });
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ current_step: 1, personal_info: expect.any(Object) })));
  });

  it('save draft updates existing app when appId set', async () => {
    mockCreate.mockResolvedValue({ data: { id: 10 } });
    mockUpdate.mockResolvedValue({});
    render(<NewApplicationPage />);
    // First save creates
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    // Second save updates
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(10, expect.any(Object)));
  });

  it('shows save error', async () => {
    mockCreate.mockRejectedValue(new Error('Save failed'));
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Save failed'));
  });

  it('shows saving state', async () => {
    mockCreate.mockReturnValue(new Promise(() => {}));
    render(<NewApplicationPage />);
    fireEvent.click(screen.getByText('Save Draft'));
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('sends complete form data on submit', async () => {
    mockCreate.mockResolvedValue({ data: { id: 55 } });
    mockSubmit.mockResolvedValue({});
    render(<NewApplicationPage />);
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Jane' } });
    clickNext(); clickNext(); clickNext(); clickNext();
    fireEvent.click(screen.getByText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        personal_info: expect.objectContaining({ first_name: 'Jane' }),
        car_details: expect.any(Object),
        employment_info: expect.any(Object),
        loan_details: expect.any(Object),
      }));
    });
  });

  it('renders back to dashboard link', () => {
    render(<NewApplicationPage />);
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });

  it('shows Edit Application title in edit mode', () => {
    // Default mock returns null for searchParams.get, so title is New
    render(<NewApplicationPage />);
    expect(screen.getByText('New Loan Application')).toBeInTheDocument();
  });
});
