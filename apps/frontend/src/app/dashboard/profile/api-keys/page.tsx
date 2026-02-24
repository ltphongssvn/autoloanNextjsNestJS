// apps/frontend/src/app/dashboard/profile/api-keys/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../services/api';

interface ApiKey {
  id: number;
  name: string;
  active: boolean;
  expiresAt?: string;
  expires_at?: string;
  lastUsedAt?: string;
  last_used_at?: string;
  createdAt?: string;
  created_at?: string;
  key?: string;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await api.apiKeys.list();
      const data = res.data ?? res;
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await api.apiKeys.create(newKeyName.trim());
      const result = res.data ?? res;
      setNewKeyResult(result.key);
      setNewKeyName('');
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    setError('');
    try {
      await api.apiKeys.revoke(id);
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  const handleRemove = async (id: number) => {
    setError('');
    try {
      await api.apiKeys.remove(id);
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete key');
    }
  };

  if (loading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/dashboard/profile')} className="text-blue-600 hover:underline text-sm mb-4 block">&larr; Back to Profile</button>
      <h1 className="text-2xl font-bold mb-6">API Keys</h1>
      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {newKeyResult && (
        <div role="status" className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-1">API key created. Copy it now &mdash; it won&apos;t be shown again:</p>
          <code data-testid="new-key" className="block bg-white p-2 rounded font-mono text-sm break-all">{newKeyResult}</code>
          <button onClick={() => setNewKeyResult(null)} className="mt-2 text-sm text-green-700 hover:underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Create New Key</h2>
        <div className="flex gap-3">
          <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <button onClick={handleCreate} disabled={actionLoading || !newKeyName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">{actionLoading ? 'Creating...' : 'Create'}</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-3">Your Keys</h2>
        {keys.length === 0 ? (
          <p className="text-gray-500 text-sm">No API keys yet.</p>
        ) : (
          <ul data-testid="keys-list" className="space-y-3">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{k.name}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${k.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{k.active ? 'Active' : 'Revoked'}</span>
                </div>
                <div className="flex gap-2">
                  {k.active && <button onClick={() => handleRevoke(k.id)} className="text-sm text-yellow-600 hover:underline">Revoke</button>}
                  <button onClick={() => handleRemove(k.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
