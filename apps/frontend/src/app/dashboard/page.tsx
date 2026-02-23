'use client';
import { useState, useEffect, useCallback } from 'react';
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

const ORDER_OPTIONS = [
  { label: 'Newest First', value: 'created_at desc' },
  { label: 'Oldest First', value: 'created_at asc' },
  { label: 'Status', value: 'status asc' },
];

function extractApplications(res: Record<string, unknown>): Application[] {
  if (Array.isArray(res)) return res;
  const inner = res.data as Record<string, unknown> | unknown[];
  if (Array.isArray(inner)) return inner as Application[];
  if (inner && typeof inner === 'object' && 'data' in inner && Array.isArray((inner as Record<string, unknown>).data)) {
    return (inner as Record<string, unknown>).data as Application[];
  }
  return [];
}

function getAppId(app: Application) {
  return (app as Record<string, unknown>).application_number || `#APP-${String(app.id).padStart(4, '0')}`;
}
function getVehicleInfo(app: Application) {
  const car = ((app as Record<string, unknown>).car_details as Record<string, string>) || {};
  return car.make && car.model && car.year ? `${car.year} ${car.make} ${car.model}` : null;
}
function getLoanInfo(app: Application) {
  const amount = Number((app as Record<string, unknown>).loan_amount || 0);
  const term = (app as Record<string, unknown>).loan_term || 48;
  return amount > 0 ? `$${amount.toLocaleString()} | ${term} months` : null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [orderBy, setOrderBy] = useState('created_at desc');

  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.applications.list();
      setApplications(extractApplications(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const handleDelete = async (id: number | string) => {
    if (!confirm('Delete this application?')) return;
    try {
      await api.applications.delete(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filteredApps = filter ? applications.filter((a) => a.status === filter) : applications;

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading applications...</div>;
  if (error && applications.length === 0) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/profile" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Settings</Link>
        </div>
      </header>
      <p className="text-lg mb-4">Welcome back, {user?.first_name || 'User'}!</p>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-medium text-gray-600">My Applications</h2>
        {user?.role === 'customer' && (
          <Link href="/dashboard/applications/new" data-testid="new-app-link" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">+ New Application</Link>
        )}
      </div>

      <div data-testid="filter-bar" className="flex gap-3 mb-6 flex-wrap items-center">
        <select data-testid="status-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select data-testid="order-select" value={orderBy} onChange={(e) => setOrderBy(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
          {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {filteredApps.length === 0 ? (
        <div data-testid="empty-state" className="text-center py-16 bg-white rounded-xl border">
          <p className="text-lg font-medium mb-2">No applications found</p>
          <p className="text-gray-500 mb-4">{filter ? 'Try changing your filter settings' : 'Start your first loan application today!'}</p>
          {!filter && user?.role === 'customer' && (
            <Link href="/dashboard/applications/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Create Application</Link>
          )}
        </div>
      ) : (
        <div data-testid="applications-table" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map((app) => {
            const isDraft = app.status === 'draft';
            const vehicle = getVehicleInfo(app);
            const loanInfo = getLoanInfo(app);
            return (
              <div key={app.id} data-testid="app-card" className="bg-white rounded-xl border p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold">{getAppId(app)}</span>
                    {isDraft && <span className="ml-2 text-amber-600 text-sm">(Incomplete)</span>}
                  </div>
                  <span data-testid="status-badge" className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-700'}`}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {vehicle && <p className="text-sm text-gray-600">{vehicle}</p>}
                {loanInfo && <p className="text-sm text-gray-600">{loanInfo}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {isDraft ? `Last saved: ${new Date(app.updated_at).toLocaleDateString()}` : `Created: ${new Date(app.created_at).toLocaleDateString()}`}
                </p>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                  {isDraft && (
                    <button onClick={() => handleDelete(app.id)} data-testid="delete-btn" className="text-sm text-red-600 hover:underline">Delete</button>
                  )}
                  <Link href={`/dashboard/applications/${app.id}`} className="text-sm text-blue-600 hover:underline">
                    {isDraft ? 'Continue' : 'View'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
