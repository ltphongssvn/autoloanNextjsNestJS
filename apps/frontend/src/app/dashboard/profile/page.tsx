// apps/frontend/src/app/dashboard/profile/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await api.users.updateProfile(formData);
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h1>My Profile</h1>
      <p data-testid="email">{user?.email}</p>
      <p data-testid="role">{user?.role}</p>
      {message && <div role="status">{message}</div>}
      {error && <div role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="first_name">First Name</label>
        <input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
        <label htmlFor="last_name">Last Name</label>
        <input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </main>
  );
}
