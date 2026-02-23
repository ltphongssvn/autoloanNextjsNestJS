'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '../../../services/api';
import type { Application } from '@autoloan/shared-types';

const ITEMS_PER_PAGE = 10;
const riskColors: Record<string, string> = { low: 'text-green-500', medium: 'text-amber-500', high: 'text-red-500' };

interface AppWithMetrics extends Application { dti: number; ltv: number; risk: 'low' | 'medium' | 'high'; loanAmount: number }

export default function UnderwriterDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  const getAppId = (app: Application) => app.application_number || `APP-${String(app.id).padStart(4, '0')}`;

  const appsWithMetrics: AppWithMetrics[] = useMemo(() => applications.map((app) => {
    const a = app as unknown as Record<string, unknown>;
    const loan = (a.loan_details as Record<string, string>) || {};
    const car = (a.car_details as Record<string, string>) || {};
    const emp = (a.employment_info as Record<string, string>) || {};
    const loanAmount = Number(loan.amount || app.loan_amount || 0);
    const downPayment = Number(loan.down_payment || app.down_payment || 0);
    const vehiclePrice = Number(car.price || 0);
    const income = Number(emp.income || 0);
    const term = app.loan_term || 48;
    const apr = Number(a.interest_rate || 6.9);
    const monthlyRate = apr / 100 / 12;
    const principal = loanAmount - downPayment;
    const monthly = principal > 0 && monthlyRate > 0
      ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, term))) / (Math.pow(1 + monthlyRate, term) - 1) : 0;
    const dti = income > 0 ? Math.round(((monthly * 12) / income) * 100) : 0;
    const ltv = vehiclePrice > 0 ? Math.round((principal / vehiclePrice) * 100) : 0;
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (dti > 40 || ltv > 90) risk = 'high';
    else if (dti > 30 || ltv > 80) risk = 'medium';
    return { ...app, dti, ltv, risk, loanAmount } as AppWithMetrics;
  }), [applications]);

  const filtered = useMemo(() => {
    let result = appsWithMetrics;
    if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter);
    if (riskFilter !== 'all') result = result.filter((a) => a.risk === riskFilter);
    if (amountFilter === 'under25k') result = result.filter((a) => a.loanAmount < 25000);
    else if (amountFilter === '25k-50k') result = result.filter((a) => a.loanAmount >= 25000 && a.loanAmount <= 50000);
    else if (amountFilter === 'over50k') result = result.filter((a) => a.loanAmount > 50000);
    return result;
  }, [appsWithMetrics, statusFilter, riskFilter, amountFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, riskFilter, amountFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const completed = applications.filter((a) => {
      const d = a as unknown as Record<string, unknown>;
      return (a.status === 'approved' || a.status === 'rejected') && d.decided_at &&
        new Date(d.decided_at as string).getMonth() === now.getMonth() &&
        new Date(d.decided_at as string).getFullYear() === now.getFullYear();
    }).length;
    return {
      under_review: applications.filter((a) => a.status === 'under_review').length,
      pending: applications.filter((a) => a.status === 'pending_documents').length,
      completed,
    };
  }, [applications]);

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Underwriter Dashboard</h1>

      <div data-testid="stats-cards" className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.under_review}</p>
          <p className="text-sm font-medium text-indigo-700">Under Review</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm font-medium text-amber-700">Pending Docs</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-3xl font-bold">{stats.completed}</p>
          <p className="text-sm font-medium text-green-700">Completed This Month</p>
        </div>
      </div>

      <div data-testid="filters" className="bg-white rounded-xl border p-3 flex gap-3 mb-4 flex-wrap">
        <select aria-label="Status filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="under_review">Under Review</option>
          <option value="pending_documents">Pending Docs</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select aria-label="Risk filter" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">All Risk</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
        <select aria-label="Amount filter" value={amountFilter} onChange={(e) => setAmountFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">All Amounts</option>
          <option value="under25k">Under $25k</option>
          <option value="25k-50k">$25k - $50k</option>
          <option value="over50k">Over $50k</option>
        </select>
      </div>

      {paginated.length === 0 ? (
        <p data-testid="empty-state" className="text-center text-gray-500 py-16">No applications found.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table data-testid="applications-table" className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">DTI</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">LTV</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Risk</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((app) => {
                const personal = ((app as unknown as Record<string, unknown>).personal_info as Record<string, string>) || {};
                return (
                  <tr key={app.id} data-testid="app-row" className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium">{getAppId(app)}</td>
                    <td className="px-4 py-3 text-sm">{personal.first_name} {personal.last_name}</td>
                    <td className="px-4 py-3 text-sm">${app.loanAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{app.dti}%</td>
                    <td className="px-4 py-3 text-sm">{app.ltv}%</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${riskColors[app.risk]}`}>●</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><Link href={`/dashboard/underwriter/${app.id}`} className="text-sm text-blue-600 hover:underline">Analyze</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div data-testid="risk-legend" className="flex items-center gap-4 mt-3 text-sm">
        <span>Risk:</span>
        <span className="flex items-center gap-1"><span className="text-green-500">●</span> Low</span>
        <span className="flex items-center gap-1"><span className="text-amber-500">●</span> Medium</span>
        <span className="flex items-center gap-1"><span className="text-red-500">●</span> High</span>
      </div>

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
