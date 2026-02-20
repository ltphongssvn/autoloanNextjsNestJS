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
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex gap-8 mb-4">
          <div>
            <span className="text-sm text-gray-500">Email</span>
            <p data-testid="email" className="font-medium">{user?.email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Role</span>
            <p data-testid="role" className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
      {message && <div role="status" className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      <div className="bg-white rounded-xl border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium mb-1">First Name</label>
              <input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium mb-1">Last Name</label>
              <input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
            <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </main>
  );
}
