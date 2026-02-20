// apps/frontend/src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Application } from '@autoloan/shared-types';

const statusColors: Record<string, string> = {
  draft: '#6b7280',
  submitted: '#3b82f6',
  under_review: '#f59e0b',
  pending_documents: '#8b5cf6',
  approved: '#22c55e',
  rejected: '#ef4444',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await api.applications.list();
        setApplications(Array.isArray(res) ? res : res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplications();
  }, []);

  if (isLoading) return <div role="status">Loading...</div>;
  if (error) return <div role="alert">{error}</div>;

  return (
    <main>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        {user?.role === 'customer' && (
          <Link href="/dashboard/applications/new" data-testid="new-app-link">New Application</Link>
        )}
      </header>

      {applications.length === 0 ? (
        <p data-testid="empty-state">No applications found.</p>
      ) : (
        <table data-testid="applications-table">
          <thead>
            <tr>
              <th>Application #</th>
              <th>Status</th>
              <th>Loan Amount</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} data-testid="app-row">
                <td>{app.application_number}</td>
                <td>
                  <span data-testid="status-badge" style={{ color: statusColors[app.status] || '#6b7280' }}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>{app.loan_amount ? `$${Number(app.loan_amount).toLocaleString()}` : '—'}</td>
                <td>{new Date(app.created_at).toLocaleDateString()}</td>
                <td><Link href={`/dashboard/applications/${app.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
