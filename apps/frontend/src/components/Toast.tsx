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

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

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

  if (toasts.length === 0) return null;

  return (
    <div data-testid="toast-container" className="fixed top-4 right-4 z-50">
      {toasts.map((toast) => (
        <div key={toast.id} data-testid="toast" role="alert" className={`${toastStyles[toast.type]} text-white px-4 py-3 rounded-lg mb-2 flex justify-between items-center min-w-[280px] shadow-lg`}>
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} aria-label="Dismiss" className="ml-3 text-white/80 hover:text-white transition">&times;</button>
        </div>
      ))}
    </div>
  );
}
