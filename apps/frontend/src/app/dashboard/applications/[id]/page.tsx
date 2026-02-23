'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../services/api';
import StatusHistoryList from '../../../../components/StatusHistory';
import NotesList from '../../../../components/NotesList';
import DocumentUpload from '../../../../components/DocumentUpload';
import type { Application } from '@autoloan/shared-types';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  pending_documents: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function field(obj: Record<string, unknown> | undefined, key: string): string {
  if (!obj) return '';
  const v = obj[key];
  return v != null ? String(v) : '';
}
function money(val: unknown): string {
  const n = Number(val || 0);
  return n > 0 ? `$${n.toLocaleString()}` : '—';
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

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

  const handleSubmit = async () => {
    try {
      const res = await api.applications.submit(Number(id));
      setApplication(res.data ?? res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    }
  };

  const handleSign = async () => {
    try {
      const res = await api.applications.sign(Number(id), 'electronic-signature');
      setApplication(res.data ?? res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await api.applications.agreementPdf(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loan_agreement_${application?.application_number || id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download agreement');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const app = application as unknown as Record<string, unknown>;
  const personal = (app.personal_info as Record<string, unknown>) || {};
  const car = (app.car_details as Record<string, unknown>) || {};
  // loan_details accessed via app directly
  const employment = (app.employment_info as Record<string, unknown>) || {};

  const isStaff = user?.role === 'loan_officer' || user?.role === 'underwriter';
  const isCustomer = user?.role === 'customer';
  const canSubmitApp = isCustomer && application.status === 'draft';
  const canSign = isCustomer && application.status === 'approved';
  const canDownloadPdf = application.status === 'approved' || application.status === 'signed';

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Dashboard</button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Application {application.application_number}</h1>
        <span data-testid="status" className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[application.status] || 'bg-gray-100 text-gray-700'}`}>
          {application.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      <section data-testid="personal-section" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Personal Information</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <InfoRow label="Name" value={`${field(personal, 'first_name')} ${field(personal, 'last_name')}`.trim()} />
          <InfoRow label="Email" value={field(personal, 'email')} />
          <InfoRow label="Phone" value={field(personal, 'phone')} />
          <InfoRow label="Date of Birth" value={field(personal, 'dob')} />
          <InfoRow label="Address" value={[field(personal, 'address'), field(personal, 'city'), `${field(personal, 'state')} ${field(personal, 'zip')}`].filter(Boolean).join(', ')} />
        </dl>
      </section>

      <section data-testid="vehicle-section" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Vehicle Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <InfoRow label="Make" value={field(car, 'make')} />
          <InfoRow label="Model" value={field(car, 'model')} />
          <InfoRow label="Year" value={field(car, 'year')} />
          <InfoRow label="Price" value={money(car.price)} />
          <InfoRow label="Condition" value={field(car, 'condition')} />
          <InfoRow label="VIN" value={field(car, 'vin')} />
        </dl>
      </section>

      <section data-testid="loan-section" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Loan Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <InfoRow label="Loan Amount" value={money(application.loan_amount)} />
          <InfoRow label="Down Payment" value={money(application.down_payment)} />
          <InfoRow label="Loan Term" value={application.loan_term ? `${application.loan_term} months` : '—'} />
          <InfoRow label="Interest Rate" value={app.interest_rate ? `${app.interest_rate}%` : '—'} />
          <InfoRow label="Monthly Payment" value={app.monthly_payment ? `$${Number(app.monthly_payment).toFixed(2)}` : '—'} />
        </dl>
      </section>

      <section data-testid="employment-section" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Employment Information</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <InfoRow label="Employer" value={field(employment, 'employer')} />
          <InfoRow label="Job Title" value={field(employment, 'job_title')} />
          <InfoRow label="Years at Job" value={field(employment, 'years')} />
          <InfoRow label="Annual Income" value={money(employment.income)} />
          <InfoRow label="Credit Score" value={field(employment, 'credit_score')} />
        </dl>
      </section>

      <section data-testid="timeline-section" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Timeline</h2>
        <p className="text-sm">Created: {new Date(application.created_at).toLocaleString()}</p>
        {app.submitted_at && <p className="text-sm">Submitted: {new Date(app.submitted_at as string).toLocaleString()}</p>}
        {app.decided_at && <p className="text-sm">Decided: {new Date(app.decided_at as string).toLocaleString()}</p>}
      </section>

      {canSubmitApp && (
        <section data-testid="customer-actions" className="bg-white rounded-xl border p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">Actions</h2>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Submit Application</button>
        </section>
      )}

      {canSign && (
        <section data-testid="customer-actions" className="bg-white rounded-xl border p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">Actions</h2>
          <div className="flex gap-3">
            <button onClick={handleSign} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">Sign Agreement</button>
            <button onClick={handleDownloadPdf} disabled={downloading} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50">
              {downloading ? 'Downloading...' : 'Download Agreement'}
            </button>
          </div>
        </section>
      )}

      {canDownloadPdf && !canSign && (
        <section data-testid="download-section" className="bg-white rounded-xl border p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">Agreement</h2>
          <button onClick={handleDownloadPdf} disabled={downloading} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50">
            {downloading ? 'Downloading...' : 'Download Agreement'}
          </button>
        </section>
      )}

      {isStaff && application.status === 'submitted' && (
        <section data-testid="staff-actions" className="bg-white rounded-xl border p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">Actions</h2>
          <button onClick={() => handleStatusUpdate('under_review')} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition">Start Review</button>
        </section>
      )}

      {isStaff && application.status === 'under_review' && (
        <section data-testid="staff-actions" className="bg-white rounded-xl border p-6 mb-4">
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
