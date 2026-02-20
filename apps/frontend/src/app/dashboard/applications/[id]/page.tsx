// apps/frontend/src/app/dashboard/applications/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../services/api';
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
        setApplication(res.data);
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
      setApplication(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (isLoading) return <div role="status">Loading...</div>;
  if (error) return <div role="alert">{error}</div>;
  if (!application) return <div>Application not found</div>;

  const isStaff = user?.role === 'loan_officer' || user?.role === 'underwriter';

  return (
    <main>
      <button onClick={() => router.back()}>Back</button>
      <h1>Application {application.application_number}</h1>
      <dl>
        <dt>Status</dt>
        <dd data-testid="status">{application.status}</dd>
        <dt>Loan Amount</dt>
        <dd data-testid="loan-amount">${application.loan_amount ? Number(application.loan_amount).toLocaleString() : 'N/A'}</dd>
        <dt>Down Payment</dt>
        <dd data-testid="down-payment">${application.down_payment ? Number(application.down_payment).toLocaleString() : 'N/A'}</dd>
        <dt>Loan Term</dt>
        <dd data-testid="loan-term">{application.loan_term ?? 'N/A'} months</dd>
      </dl>
      {isStaff && application.status === 'submitted' && (
        <section data-testid="staff-actions">
          <h2>Actions</h2>
          <button onClick={() => handleStatusUpdate('under_review')}>Start Review</button>
        </section>
      )}
      {isStaff && application.status === 'under_review' && (
        <section data-testid="staff-actions">
          <h2>Actions</h2>
          <button onClick={() => handleStatusUpdate('approved')}>Approve</button>
          <button onClick={() => handleStatusUpdate('rejected')}>Reject</button>
        </section>
      )}
    </main>
  );
}
