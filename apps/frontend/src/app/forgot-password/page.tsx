'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
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
      const response = await fetch(`${API}/auth/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: { email } }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Password reset instructions sent to your email');
        setEmail('');
      } else {
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          setError(errorMessages || 'Failed to send reset instructions');
        } else if (Array.isArray(data.errors)) {
          setError(data.errors.join(', '));
        } else {
          setError(data.error || 'Failed to send reset instructions');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-blue-600 mb-1">Auto Loan</h2>
        <h1 className="text-lg font-semibold mb-1">Forgot Password</h1>
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
        <p className="text-center mt-4 text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
