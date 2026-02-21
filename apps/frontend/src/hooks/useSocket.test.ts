import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';

const mockOn = vi.fn();
const mockDisconnect = vi.fn();
const mockSocket = { on: mockOn, disconnect: mockDisconnect };

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('does not connect without token', () => {
    const { result } = renderHook(() => useSocket());
    expect(result.current.connected).toBe(false);
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('connects with token and handles connect event', async () => {
    localStorage.setItem('token', 'test-token');
    const { result } = renderHook(() => useSocket());
    const connectHandler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'connect');
    expect(connectHandler).toBeDefined();
    act(() => { connectHandler![1](); });
    expect(result.current.connected).toBe(true);
  });

  it('handles disconnect event', () => {
    localStorage.setItem('token', 'test-token');
    const { result } = renderHook(() => useSocket());
    const connectHandler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'connect');
    act(() => { connectHandler![1](); });
    expect(result.current.connected).toBe(true);
    const disconnectHandler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'disconnect');
    act(() => { disconnectHandler![1](); });
    expect(result.current.connected).toBe(false);
  });

  it('receives status_change notification', () => {
    localStorage.setItem('token', 'test-token');
    const { result } = renderHook(() => useSocket());
    const handler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'status_change');
    act(() => { handler![1]({ applicationId: 1, newStatus: 'approved' }); });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].event).toBe('status_change');
    expect(result.current.unreadCount).toBe(1);
  });

  it('receives document_uploaded notification', () => {
    localStorage.setItem('token', 'test-token');
    const { result } = renderHook(() => useSocket());
    const handler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'document_uploaded');
    act(() => { handler![1]({ applicationId: 1, docType: 'pay_stub' }); });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].event).toBe('document_uploaded');
  });

  it('receives application_submitted notification', () => {
    localStorage.setItem('token', 'test-token');
    const { result } = renderHook(() => useSocket());
    const handler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'application_submitted');
    act(() => { handler![1]({ applicationId: 1 }); });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].event).toBe('application_submitted');
  });

  it('markRead marks a single notification as read', () => {
    localStorage.setItem('token', 'test-token');
    const { result } = renderHook(() => useSocket());
    const handler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'status_change');
    act(() => { handler![1]({ applicationId: 1 }); });
    expect(result.current.unreadCount).toBe(1);
    const id = result.current.notifications[0].id;
    act(() => { result.current.markRead(id); });
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('markAllRead marks all notifications as read', () => {
    localStorage.setItem('token', 'test-token');
    const { result } = renderHook(() => useSocket());
    const handler = mockOn.mock.calls.find((c: unknown[]) => c[0] === 'status_change');
    act(() => { handler![1]({ a: 1 }); });
    act(() => { handler![1]({ a: 2 }); });
    expect(result.current.unreadCount).toBe(2);
    act(() => { result.current.markAllRead(); });
    expect(result.current.unreadCount).toBe(0);
  });

  it('disconnects on unmount', () => {
    localStorage.setItem('token', 'test-token');
    const { unmount } = renderHook(() => useSocket());
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
