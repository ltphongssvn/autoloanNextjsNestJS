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
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      const res = await api.auth.resetPassword(token, password);
      setSuccess(res?.message || 'Password has been reset successfully');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Auto Loan</h1>
          <h2 className="text-lg font-semibold mb-2">Invalid Reset Link</h2>
          <p className="text-gray-500 mb-4">This reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline">Request a new reset link</Link>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-1">Auto Loan</h1>
        <h2 className="text-lg font-semibold mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your new password below.</p>
        {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        {success && <div role="status" className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">New Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1">Confirm Password</label>
            <input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </p>
      </div>
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
