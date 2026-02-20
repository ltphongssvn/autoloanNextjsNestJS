// apps/frontend/src/app/signup/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h1>Create Account</h1>
      {error && <div role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="first_name">First Name</label>
        <input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
        <label htmlFor="last_name">Last Name</label>
        <input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
        <label htmlFor="password_confirmation">Confirm Password</label>
        <input id="password_confirmation" name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Account'}</button>
      </form>
    </main>
  );
}
