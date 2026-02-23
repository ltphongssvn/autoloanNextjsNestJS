'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function AccountLockedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'locked' | 'sending' | 'sent' | 'error'>('locked');
  const [message, setMessage] = useState('');

  const handleRequestUnlock = async () => {
    if (!email) {
      setStatus('error');
      setMessage('No email address available for unlock request.');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(`${API}/auth/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('sent');
        setMessage('Unlock instructions have been sent to your email.');
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data?.message || 'Failed to send unlock instructions.');
      }
    } catch {
      setStatus('error');
      setMessage('Unable to send unlock request. Please try again later.');
    }
  };

  return (
    <>
      <div data-testid="locked-icon" className="text-6xl mb-4">🔒</div>
      <p className="text-gray-600 mb-6">Your account has been locked due to too many failed login attempts. For your security, please wait or request an unlock email.</p>
      {status === 'locked' && (
        <div data-testid="locked-actions" className="space-y-4">
          <button onClick={handleRequestUnlock} data-testid="request-unlock" className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Send Unlock Instructions
          </button>
          <p className="text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
          </p>
        </div>
      )}
      {status === 'sending' && (
        <div data-testid="locked-sending" className="text-gray-500">
          <p>Sending unlock instructions...</p>
        </div>
      )}
      {status === 'sent' && (
        <div data-testid="locked-sent" className="p-4 bg-green-50 text-green-700 rounded-lg">
          <p className="mb-4">{message}</p>
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Back to Login</Link>
        </div>
      )}
      {status === 'error' && (
        <div data-testid="locked-error" className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
          <p>{message}</p>
          <button onClick={() => setStatus('locked')} className="mt-3 text-blue-600 hover:underline text-sm">Try Again</button>
        </div>
      )}
    </>
  );
}

export default function AccountLockedPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-6">Account Locked</h1>
      <Suspense fallback={<div className="text-gray-500"><p>Loading...</p></div>}>
        <AccountLockedContent />
      </Suspense>
    </main>
  );
}
