'use client';
import { useState, useRef, useEffect } from 'react';
import { useSocket, Notification } from '../hooks/useSocket';

function formatEvent(event: string): string {
  const map: Record<string, string> = {
    status_change: 'Status Updated',
    document_uploaded: 'Document Uploaded',
    application_submitted: 'Application Submitted',
  };
  return map[event] || event;
}

function formatData(n: Notification): string {
  const d = n.data;
  if (n.event === 'status_change') return `${d.applicationNumber}: ${d.oldStatus} → ${d.newStatus}`;
  if (n.event === 'document_uploaded') return `${d.applicationNumber}: ${d.docType}`;
  if (n.event === 'application_submitted') return `${d.applicationNumber} submitted`;
  return JSON.stringify(d);
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Notifications" className="relative p-1 text-gray-600 hover:text-blue-600 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span data-testid="unread-badge" className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div data-testid="notification-dropdown" className="absolute right-0 mt-2 w-80 bg-white rounded-xl border shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} onClick={() => markRead(n.id)} className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${n.read ? 'opacity-60' : ''}`}>
                <p className="text-sm font-medium">{formatEvent(n.event)}</p>
                <p className="text-xs text-gray-500">{formatData(n)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
