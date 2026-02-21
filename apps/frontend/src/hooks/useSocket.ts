import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export interface Notification {
  id: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  read: boolean;
}

let notifCounter = 0;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${WS_URL}/notifications`, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const events = ['status_change', 'document_uploaded', 'application_submitted'];
    events.forEach((event) => {
      socket.on(event, (data: Record<string, unknown>) => {
        notifCounter += 1;
        setNotifications((prev) => [
          { id: `notif-${notifCounter}`, event, data, timestamp: new Date().toISOString(), read: false },
          ...prev,
        ]);
      });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { connected, notifications, unreadCount, markRead, markAllRead };
}
