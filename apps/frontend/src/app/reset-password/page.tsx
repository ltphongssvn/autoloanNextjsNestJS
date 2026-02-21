// apps/frontend/src/app/reset-password/page.tsx
'use client';
import { useState, type FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../services/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.auth.resetPassword(token, password);
      router.push('/login?reset=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
        <p className="text-gray-500 mb-4">This reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-blue-600 hover:underline">Request a new reset link</Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">New Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium mb-1">Confirm Password</label>
          <input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
