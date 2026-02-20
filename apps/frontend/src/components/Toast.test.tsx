// apps/frontend/src/components/Toast.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ToastContainer, { showToast } from './Toast';

describe('ToastContainer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

  it('should render nothing when no toasts', () => {
    render(<ToastContainer />);
    expect(screen.queryByTestId('toast-container')).toBeNull();
  });

  it('should show a toast via showToast', async () => {
    render(<ToastContainer />);
    await act(async () => {
      showToast('Hello', 'info');
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should show success toast', async () => {
    render(<ToastContainer />);
    await act(async () => {
      showToast('Saved', 'success');
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should show error toast', async () => {
    render(<ToastContainer />);
    await act(async () => {
      showToast('Failed', 'error');
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should auto-dismiss after 4 seconds', async () => {
    render(<ToastContainer />);
    await act(async () => {
      showToast('Temp', 'info');
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText('Temp')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(4100); });
    expect(screen.queryByText('Temp')).toBeNull();
  });

  it('should dismiss on click', async () => {
    render(<ToastContainer />);
    await act(async () => {
      showToast('Dismiss me', 'info');
      vi.advanceTimersByTime(0);
    });
    await act(async () => { fireEvent.click(screen.getByLabelText('Dismiss')); });
    expect(screen.queryByText('Dismiss me')).toBeNull();
  });

  it('should show multiple toasts', async () => {
    render(<ToastContainer />);
    await act(async () => {
      showToast('First', 'info');
      vi.advanceTimersByTime(1);
    });
    await act(async () => {
      showToast('Second', 'success');
      vi.advanceTimersByTime(0);
    });
    expect(screen.getAllByTestId('toast')).toHaveLength(2);
  });

  it('should not call addToastFn when unmounted', async () => {
    const { unmount } = render(<ToastContainer />);
    unmount();
    await act(async () => {
      showToast('Should not appear', 'info');
      vi.advanceTimersByTime(0);
    });
    expect(screen.queryByTestId('toast-container')).toBeNull();
  });
});
