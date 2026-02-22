// apps/frontend/src/app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Application } from '@autoloan/shared-types';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  pending_documents: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function extractApplications(res: Record<string, unknown>): Application[] {
  // Handle envelope: { status, data: { data: [...], pagination } }
  // Handle flat: { data: [...], pagination }
  // Handle bare array: [...]
  if (Array.isArray(res)) return res;
  const inner = res.data as Record<string, unknown> | unknown[];
  if (Array.isArray(inner)) return inner as Application[];
  if (inner && typeof inner === 'object' && 'data' in inner && Array.isArray((inner as Record<string, unknown>).data)) {
    return (inner as Record<string, unknown>).data as Application[];
  }
  return [];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await api.applications.list();
        setApplications(extractApplications(res));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplications();
  }, []);

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {user?.role === 'customer' && (
          <Link href="/dashboard/applications/new" data-testid="new-app-link" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">New Application</Link>
        )}
      </header>
      {applications.length === 0 ? (
        <p data-testid="empty-state" className="text-center text-gray-500 py-16">No applications found.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table data-testid="applications-table" className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Application #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Loan Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((app) => (
                <tr key={app.id} data-testid="app-row" className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium">{app.application_number}</td>
                  <td className="px-4 py-3">
                    <span data-testid="status-badge" className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-700'}`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{app.loan_amount ? `$${Number(app.loan_amount).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Link href={`/dashboard/applications/${app.id}`} className="text-sm text-blue-600 hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
