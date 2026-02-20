// apps/frontend/src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Application } from '@autoloan/shared-types';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await api.applications.list();
        setApplications(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplications();
  }, []);

  if (isLoading) return <div role="status">Loading...</div>;

  return (
    <main>
      <header>
        <h1>Dashboard</h1>
        <span data-testid="user-info">{user?.full_name} ({user?.role})</span>
        <button onClick={logout}>Logout</button>
      </header>
      {error && <div role="alert">{error}</div>}
      <section>
        <h2>Applications</h2>
        {applications.length === 0 ? (
          <p>No applications found.</p>
        ) : (
          <ul>
            {applications.map((app) => (
              <li key={app.id}>
                <a href={`/dashboard/applications/${app.id}`}>
                  {app.application_number} — {app.status}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
