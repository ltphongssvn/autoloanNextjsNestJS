'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '../../../services/api';
import type { Application } from '@autoloan/shared-types';

const ITEMS_PER_PAGE = 10;
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'New' },
  { value: 'pending', label: 'Verifying' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'pending_documents', label: 'Pending Docs' },
];
const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700', pending: 'bg-amber-100 text-amber-700',
  under_review: 'bg-purple-100 text-purple-700', pending_documents: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
};

export default function LoanOfficerDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.loanOfficer.list();
        setApplications(Array.isArray(res) ? res : res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const getAppId = (app: Application & Record<string, unknown>) => String(app.application_number || `APP-${String(app.id).padStart(4, '0')}`);

  const stats = useMemo(() => ({
    submitted: applications.filter((a) => a.status === 'submitted').length,
    pending: applications.filter((a) => a.status === 'pending').length,
    under_review: applications.filter((a) => a.status === 'under_review').length,
  }), [applications]);

  const filtered = useMemo(() => {
    let result = filter === 'all' ? applications : applications.filter((a) => a.status === filter);
    if (dateFilter !== 'all') {
      const cutoff = new Date();
      if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0);
      else if (dateFilter === 'week') cutoff.setDate(cutoff.getDate() - 7);
      else if (dateFilter === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
      result = result.filter((a) => new Date(a.created_at) >= cutoff);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((a) => {
        const p = ((a as unknown as Record<string, unknown>).personal_info as Record<string, string>) || {};
        const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        return name.includes(term) || getAppId(a as Application & Record<string, unknown>).toLowerCase().includes(term);
      });
    }
    return result;
  }, [applications, filter, dateFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [filter, dateFilter, searchTerm]);

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Loan Officer Dashboard</h1>

      <div data-testid="stats-cards" className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.under_review}</p>
          <p className="text-sm font-medium text-amber-700">Pending Review</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.submitted}</p>
          <p className="text-sm font-medium text-blue-700">New Applications</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm font-medium text-green-700">Verifying</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border mb-4">
        <div data-testid="status-tabs" className="flex border-b overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button key={t.value} onClick={() => setFilter(t.value)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${filter === t.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div data-testid="filters" className="p-3 flex gap-3">
          <select aria-label="Date range" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <input aria-label="Search" type="text" placeholder="Search applicant or ID..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      {paginated.length === 0 ? (
        <p data-testid="empty-state" className="text-center text-gray-500 py-16">No applications to review.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table data-testid="applications-table" className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((app) => {
                const a = app as unknown as Record<string, unknown>;
                const personal = (a.personal_info as Record<string, string>) || {};
                const loan = (a.loan_details as Record<string, string>) || {};
                return (
                  <tr key={app.id} data-testid="app-row" className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium">{getAppId(app as Application & Record<string, unknown>)}</td>
                    <td className="px-4 py-3 text-sm">{personal.first_name} {personal.last_name}</td>
                    <td className="px-4 py-3 text-sm">${Number(loan.amount || app.loan_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-700'}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/loan-officer/${app.id}`} className="text-sm text-blue-600 hover:underline">Review</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div data-testid="pagination" className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded text-sm ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
