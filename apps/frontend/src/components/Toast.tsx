// apps/frontend/src/components/Toast.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastCounter = 0;
let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = 'info') {
  if (addToastFn) addToastFn(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => removeToast(id), 4000);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const bgColor = (type: ToastType) => {
    if (type === 'success') return '#16a34a';
    if (type === 'error') return '#dc2626';
    return '#2563eb';
  };

  if (toasts.length === 0) return null;

  return (
    <div data-testid="toast-container" style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
      {toasts.map((toast) => (
        <div key={toast.id} data-testid="toast" role="alert" style={{ background: bgColor(toast.type), color: '#fff', padding: '12px 16px', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', minWidth: 280 }}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 12 }}>✕</button>
        </div>
      ))}
    </div>
  );
}
