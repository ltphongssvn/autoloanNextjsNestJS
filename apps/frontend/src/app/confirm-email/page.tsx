'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('confirmation_token');
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'No confirmation token provided.');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const confirm = async () => {
      try {
        const res = await fetch(`${API}/auth/confirm?confirmation_token=${encodeURIComponent(token)}`);
        const data = await res.json();
        const msg = data?.data?.message || data?.message || '';
        if (cancelled) return;
        if (!res.ok) {
          setStatus('error');
          setMessage(msg || 'Confirmation failed. Token may be invalid or expired.');
        } else if (msg.includes('already')) {
          setStatus('already');
          setMessage(msg);
        } else {
          setStatus('success');
          setMessage(msg || 'Email confirmed successfully!');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Unable to confirm email. Please try again later.');
        }
      }
    };
    confirm();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-6">Email Confirmation</h1>
      {status === 'loading' && (
        <div data-testid="confirm-loading" className="text-gray-500">
          <p>Confirming your email...</p>
        </div>
      )}
      {status === 'success' && (
        <div data-testid="confirm-success" className="p-4 bg-green-50 text-green-700 rounded-lg">
          <p className="mb-4">{message}</p>
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Go to Login</Link>
        </div>
      )}
      {status === 'already' && (
        <div data-testid="confirm-already" className="p-4 bg-blue-50 text-blue-700 rounded-lg">
          <p className="mb-4">{message}</p>
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Go to Login</Link>
        </div>
      )}
      {status === 'error' && (
        <div data-testid="confirm-error" className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p>{message}</p>
        </div>
      )}
    </main>
  );
}
