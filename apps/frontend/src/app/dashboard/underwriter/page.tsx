// apps/frontend/src/app/dashboard/underwriter/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../services/api';
import type { Application } from '@autoloan/shared-types';

const statusColors: Record<string, string> = {
  under_review: 'bg-amber-100 text-amber-700',
  pending_documents: 'bg-purple-100 text-purple-700',
};

type AppWithUser = Application & { user?: { firstName?: string; first_name?: string; lastName?: string; last_name?: string }; applicationNumber?: string; loanAmount?: number };

export default function UnderwriterDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.underwriter.list();
        setApplications(Array.isArray(res) ? res : res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Underwriter Dashboard</h1>
      {applications.length === 0 ? (
        <p data-testid="empty-state" className="text-center text-gray-500 py-16">No applications to review.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table data-testid="applications-table" className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Application #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Loan Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((app) => {
                const a = app as AppWithUser;
                return (
                  <tr key={a.id} data-testid="app-row" className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium">{a.application_number || a.applicationNumber}</td>
                    <td className="px-4 py-3 text-sm">{a.user ? `${a.user.firstName || a.user.first_name} ${a.user.lastName || a.user.last_name}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[a.status] || 'bg-gray-100 text-gray-700'}`}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{a.loan_amount || a.loanAmount ? `$${Number(a.loan_amount || a.loanAmount).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/underwriter/${a.id}`} className="text-sm text-blue-600 hover:underline">Review</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
