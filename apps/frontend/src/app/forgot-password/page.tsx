// apps/frontend/src/app/forgot-password/page.tsx
'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await api.auth.requestPasswordReset(email);
      setMessage(res.message || 'If the email exists, a reset link has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
      <p className="text-gray-500 mb-6">Enter your email to receive a password reset link.</p>
      {message && <div role="status" className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-500">
        Remember your password? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
      </p>
    </main>
  );
}
