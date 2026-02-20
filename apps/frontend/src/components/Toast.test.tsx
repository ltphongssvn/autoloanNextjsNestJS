// apps/frontend/src/components/Toast.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ToastContainer, { showToast } from './Toast';

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render nothing when no toasts', () => {
    render(<ToastContainer />);
    expect(screen.queryByTestId('toast-container')).toBeNull();
  });

  it('should show a toast via showToast', () => {
    render(<ToastContainer />);
    act(() => showToast('Hello', 'info'));
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should show success toast', () => {
    render(<ToastContainer />);
    act(() => showToast('Saved', 'success'));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should show error toast', () => {
    render(<ToastContainer />);
    act(() => showToast('Failed', 'error'));
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should auto-dismiss after 4 seconds', async () => {
    render(<ToastContainer />);
    act(() => showToast('Temp', 'info'));
    expect(screen.getByText('Temp')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4100));
    expect(screen.queryByText('Temp')).toBeNull();
  });

  it('should dismiss on click', () => {
    render(<ToastContainer />);
    act(() => showToast('Dismiss me', 'info'));
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Dismiss me')).toBeNull();
  });

  it('should show multiple toasts', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('First', 'info');
      showToast('Second', 'success');
    });
    expect(screen.getAllByTestId('toast')).toHaveLength(2);
  });

  it('should not call addToastFn when unmounted', () => {
    const { unmount } = render(<ToastContainer />);
    unmount();
    act(() => showToast('Should not appear', 'info'));
    expect(screen.queryByTestId('toast-container')).toBeNull();
  });
});
