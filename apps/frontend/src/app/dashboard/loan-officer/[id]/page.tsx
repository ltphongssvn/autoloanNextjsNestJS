// apps/frontend/src/app/dashboard/loan-officer/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../services/api';
import DocumentUpload from '../../../../components/DocumentUpload';
import type { Application } from '@autoloan/shared-types';

export default function LoanOfficerReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.loanOfficer.get(Number(id));
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
      if (action === 'start-verification') res = await api.loanOfficer.startVerification(Number(id));
      else if (action === 'review') res = await api.loanOfficer.review(Number(id));
      else if (action === 'request-documents') res = await api.loanOfficer.requestDocuments(Number(id), { notes: note });
      setApplication(res?.data ?? res);
      if (action === 'request-documents') setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.loanOfficer.addNote(Number(id), note);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !application) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const appNum = application.application_number || (application as Application & { applicationNumber?: string }).applicationNumber;
  const loanAmt = application.loan_amount || (application as Application & { loanAmount?: number }).loanAmount;
  const downPmt = application.down_payment || (application as Application & { downPayment?: number }).downPayment;
  const term = application.loan_term || (application as Application & { loanTerm?: number }).loanTerm;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/dashboard/loan-officer')} className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Dashboard</button>
      <h1 className="text-2xl font-bold mb-6">Review Application {appNum}</h1>

      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border p-6 mb-6">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><dt className="text-sm text-gray-500">Status</dt><dd className="font-medium capitalize">{application.status.replace(/_/g, ' ')}</dd></div>
          <div><dt className="text-sm text-gray-500">Loan Amount</dt><dd className="font-medium">${Number(loanAmt || 0).toLocaleString()}</dd></div>
          <div><dt className="text-sm text-gray-500">Down Payment</dt><dd className="font-medium">${Number(downPmt || 0).toLocaleString()}</dd></div>
          <div><dt className="text-sm text-gray-500">Loan Term</dt><dd className="font-medium">{term || 'N/A'} months</dd></div>
        </dl>
      </div>

      <div data-testid="lo-actions" className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Actions</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {application.status === 'submitted' && (
            <button onClick={() => handleAction('start-verification')} disabled={!!actionLoading} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition">
              {actionLoading === 'start-verification' ? 'Processing...' : 'Start Verification'}
            </button>
          )}
          {(application.status === 'submitted' || application.status === 'pending_documents') && (
            <button onClick={() => handleAction('review')} disabled={!!actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {actionLoading === 'review' ? 'Processing...' : 'Move to Review'}
            </button>
          )}
          {(application.status === 'submitted' || application.status === 'under_review') && (
            <button onClick={() => handleAction('request-documents')} disabled={!!actionLoading} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition">
              {actionLoading === 'request-documents' ? 'Processing...' : 'Request Documents'}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <button onClick={handleAddNote} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition">Add Note</button>
        </div>
      </div>

      <DocumentUpload applicationId={Number(id)} />
    </main>
  );
}
