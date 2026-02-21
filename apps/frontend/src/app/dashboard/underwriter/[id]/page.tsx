// apps/frontend/src/app/dashboard/underwriter/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../services/api';
import DocumentUpload from '../../../../components/DocumentUpload';
import type { Application } from '@autoloan/shared-types';

export default function UnderwriterReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.underwriter.get(Number(id));
        setApplication(res.data ?? res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    setError('');
    try {
      let res;
      if (action === 'approve') {
        res = await api.underwriter.approve(Number(id), {
          loan_term: loanTerm ? Number(loanTerm) : undefined,
          interest_rate: interestRate ? Number(interestRate) : undefined,
          monthly_payment: monthlyPayment ? Number(monthlyPayment) : undefined,
          decision_notes: note || undefined,
        });
      } else if (action === 'reject') {
        res = await api.underwriter.reject(Number(id), {
          rejection_reason: rejectionReason,
          decision_notes: note || undefined,
        });
      } else if (action === 'request-documents') {
        res = await api.underwriter.requestDocuments(Number(id), { notes: note });
      }
      setApplication(res?.data ?? res);
      setNote('');
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !application) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const appNum = application.application_number || (application as Application & { applicationNumber?: string }).applicationNumber;
  const loanAmt = application.loan_amount || (application as Application & { loanAmount?: number }).loanAmount;
  const downPmt = application.down_payment || (application as Application & { downPayment?: number }).downPayment;
  const term = application.loan_term || (application as Application & { loanTerm?: number }).loanTerm;
  const rejReason = application.rejection_reason || (application as Application & { rejectionReason?: string }).rejectionReason;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/dashboard/underwriter')} className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Dashboard</button>
      <h1 className="text-2xl font-bold mb-6">Underwrite Application {appNum}</h1>

      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border p-6 mb-6">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><dt className="text-sm text-gray-500">Status</dt><dd className="font-medium capitalize">{application.status.replace(/_/g, ' ')}</dd></div>
          <div><dt className="text-sm text-gray-500">Loan Amount</dt><dd className="font-medium">${Number(loanAmt || 0).toLocaleString()}</dd></div>
          <div><dt className="text-sm text-gray-500">Down Payment</dt><dd className="font-medium">${Number(downPmt || 0).toLocaleString()}</dd></div>
          <div><dt className="text-sm text-gray-500">Loan Term</dt><dd className="font-medium">{term || 'N/A'} months</dd></div>
        </dl>
      </div>

      <div data-testid="uw-actions" className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Underwriting Decision</h2>

        {(application.status === 'under_review' || application.status === 'pending_documents') && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Final Loan Term (months)</label>
                <input type="number" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)} placeholder="60" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                <input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="5.99" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Payment ($)</label>
                <input type="number" step="0.01" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} placeholder="450.00" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Decision notes..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Rejection Reason (if rejecting)</label>
              <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAction('approve')} disabled={!!actionLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition">
                {actionLoading === 'approve' ? 'Processing...' : 'Approve'}
              </button>
              <button onClick={() => handleAction('reject')} disabled={!!actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {actionLoading === 'reject' ? 'Processing...' : 'Reject'}
              </button>
              <button onClick={() => handleAction('request-documents')} disabled={!!actionLoading} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition">
                {actionLoading === 'request-documents' ? 'Processing...' : 'Request Documents'}
              </button>
            </div>
          </>
        )}

        {application.status === 'approved' && <p className="text-green-700 font-medium">This application has been approved.</p>}
        {application.status === 'rejected' && <p className="text-red-700 font-medium">This application has been rejected. Reason: {rejReason || 'N/A'}</p>}
      </div>

      <DocumentUpload applicationId={Number(id)} />
    </main>
  );
}
