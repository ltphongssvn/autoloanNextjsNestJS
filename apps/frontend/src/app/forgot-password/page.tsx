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
      setMessage(res.message || 'Password reset instructions sent to your email');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset instructions');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-1">Auto Loan</h1>
        <h2 className="text-lg font-semibold mb-1">Forgot Password</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you instructions to reset your password.</p>
        {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        {message && <div role="status" className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
