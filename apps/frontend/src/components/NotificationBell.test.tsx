import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationBell from './NotificationBell';

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockUseSocket = vi.fn();

vi.mock('../hooks/useSocket', () => ({
  useSocket: () => mockUseSocket(),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSocket.mockReturnValue({ notifications: [], unreadCount: 0, markRead: mockMarkRead, markAllRead: mockMarkAllRead });
  });

  it('renders bell button', () => {
    render(<NotificationBell />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('does not show badge when no unread', () => {
    render(<NotificationBell />);
    expect(screen.queryByTestId('unread-badge')).toBeNull();
  });

  it('shows unread badge', () => {
    mockUseSocket.mockReturnValue({ notifications: [], unreadCount: 3, markRead: mockMarkRead, markAllRead: mockMarkAllRead });
    render(<NotificationBell />);
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('3');
  });

  it('toggles dropdown on click', () => {
    render(<NotificationBell />);
    expect(screen.queryByTestId('notification-dropdown')).toBeNull();
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.queryByTestId('notification-dropdown')).toBeNull();
  });

  it('shows empty state', () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('renders status_change notification', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: '1', event: 'status_change', data: { applicationNumber: 'AL-0001', oldStatus: 'submitted', newStatus: 'approved' }, timestamp: '2026-01-01', read: false }],
      unreadCount: 1, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('Status Updated')).toBeInTheDocument();
    expect(screen.getByText('AL-0001: submitted → approved')).toBeInTheDocument();
  });

  it('renders document_uploaded notification', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: '2', event: 'document_uploaded', data: { applicationNumber: 'AL-0002', docType: 'pay_stub' }, timestamp: '2026-01-01', read: false }],
      unreadCount: 1, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('Document Uploaded')).toBeInTheDocument();
    expect(screen.getByText('AL-0002: pay_stub')).toBeInTheDocument();
  });

  it('renders application_submitted notification', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: '3', event: 'application_submitted', data: { applicationNumber: 'AL-0003' }, timestamp: '2026-01-01', read: false }],
      unreadCount: 1, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('Application Submitted')).toBeInTheDocument();
    expect(screen.getByText('AL-0003 submitted')).toBeInTheDocument();
  });

  it('renders unknown event with JSON fallback', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: '4', event: 'unknown_event', data: { key: 'val' }, timestamp: '2026-01-01', read: false }],
      unreadCount: 1, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('unknown_event')).toBeInTheDocument();
    expect(screen.getByText('{"key":"val"}')).toBeInTheDocument();
  });

  it('calls markRead on notification click', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: 'n1', event: 'status_change', data: { applicationNumber: 'AL-0001', oldStatus: 'a', newStatus: 'b' }, timestamp: '2026-01-01', read: false }],
      unreadCount: 1, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    fireEvent.click(screen.getByText('Status Updated'));
    expect(mockMarkRead).toHaveBeenCalledWith('n1');
  });

  it('calls markAllRead', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: 'n1', event: 'status_change', data: {}, timestamp: '2026-01-01', read: false }],
      unreadCount: 1, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    fireEvent.click(screen.getByText('Mark all read'));
    expect(mockMarkAllRead).toHaveBeenCalled();
  });

  it('does not show Mark all read when no unread', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: 'n1', event: 'status_change', data: {}, timestamp: '2026-01-01', read: true }],
      unreadCount: 0, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.queryByText('Mark all read')).toBeNull();
  });

  it('applies read styling to read notifications', () => {
    mockUseSocket.mockReturnValue({
      notifications: [{ id: 'n1', event: 'status_change', data: { applicationNumber: 'AL-0001', oldStatus: 'a', newStatus: 'b' }, timestamp: '2026-01-01', read: true }],
      unreadCount: 0, markRead: mockMarkRead, markAllRead: mockMarkAllRead,
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    const item = screen.getByText('Status Updated').closest('div');
    expect(item?.className).toContain('opacity-60');
  });

  it('closes dropdown on outside click', () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('notification-dropdown')).toBeNull();
  });
});
