// apps/frontend/src/app/dashboard/applications/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../services/api';
import StatusHistoryList from '../../../../components/StatusHistory';
import NotesList from '../../../../components/NotesList';
import DocumentUpload from '../../../../components/DocumentUpload';
import type { Application } from '@autoloan/shared-types';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await api.applications.get(Number(id));
        setApplication(res.data ?? res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplication();
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    try {
      const res = await api.applications.updateStatus(Number(id), status);
      setApplication(res.data ?? res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const isStaff = user?.role === 'loan_officer' || user?.role === 'underwriter';

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Back</button>
      <h1 className="text-2xl font-bold mb-6">Application {application.application_number}</h1>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Status</dt>
            <dd data-testid="status" className="font-medium capitalize">{application.status.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Loan Amount</dt>
            <dd data-testid="loan-amount" className="font-medium">${application.loan_amount ? Number(application.loan_amount).toLocaleString() : 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Down Payment</dt>
            <dd data-testid="down-payment" className="font-medium">${application.down_payment ? Number(application.down_payment).toLocaleString() : 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Loan Term</dt>
            <dd data-testid="loan-term" className="font-medium">{application.loan_term ?? 'N/A'} months</dd>
          </div>
        </dl>
      </div>

      {isStaff && application.status === 'submitted' && (
        <section data-testid="staff-actions" className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Actions</h2>
          <button onClick={() => handleStatusUpdate('under_review')} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition">Start Review</button>
        </section>
      )}

      {isStaff && application.status === 'under_review' && (
        <section data-testid="staff-actions" className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Actions</h2>
          <div className="flex gap-3">
            <button onClick={() => handleStatusUpdate('approved')} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">Approve</button>
            <button onClick={() => handleStatusUpdate('rejected')} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">Reject</button>
          </div>
        </section>
      )}

      <StatusHistoryList applicationId={Number(id)} />
      <DocumentUpload applicationId={Number(id)} />
      <NotesList applicationId={Number(id)} />
    </main>
  );
}
