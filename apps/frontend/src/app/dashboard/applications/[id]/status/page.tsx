'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../../services/api';
import type { Application } from '@autoloan/shared-types';

const STEPS = ['Draft', 'Submitted', 'Pending', 'Under Review', 'Decision'];
const STATUS_STEP: Record<string, number> = {
  draft: 0, submitted: 1, pending: 2, pending_documents: 2, under_review: 3, approved: 4, rejected: 4,
};
const STATUS_DESC: Record<string, string> = {
  submitted: 'Your application has been submitted and is waiting to be processed.',
  pending: 'Intake started. Staff is verifying your initial documents.',
  pending_documents: 'Additional documents are required to continue processing.',
  under_review: 'Your application is under full underwriting review.',
  approved: 'Congratulations! Your loan has been approved.',
  rejected: 'Unfortunately, your application was not approved.',
};
const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700', pending_documents: 'bg-amber-100 text-amber-700',
  under_review: 'bg-purple-100 text-purple-700', approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

interface Doc { id: number; doc_type: string; status: string; file_name?: string; file_attached?: boolean; download_url?: string }

export default function ApplicationStatusPage() {
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.applications.get(Number(id));
        setApplication(res.data ?? res);
        try {
          const docRes = await api.documents.list(Number(id));
          setDocuments(Array.isArray(docRes) ? docRes : docRes.data ?? []);
        } catch { /* docs optional */ }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const reloadDocs = async () => {
    try {
      const docRes = await api.documents.list(Number(id));
      setDocuments(Array.isArray(docRes) ? docRes : docRes.data ?? []);
    } catch { /* ignore */ }
  };

  const handleUploadClick = (docType: string) => {
    setUploadingType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingType) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document[doc_type]", uploadingType);
      formData.append("document[file]", file);
      await api.documents.upload(Number(id), formData);
      await reloadDocs();
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      setUploadingType(null);
      e.target.value = '';
    }
  };

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !application) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const app = application as unknown as Record<string, unknown>;
  const status = application.status;
  const stepIndex = STATUS_STEP[status] ?? 0;
  const car = (app.car_details as Record<string, string>) || {};
  const loanAmount = Number(application.loan_amount || 0);
  const term = application.loan_term || 48;
  const monthly = Number(app.monthly_payment || 0);
  const lastUpdated = String(application.updated_at || application.created_at);
  const appId = String((app as Record<string, unknown>).application_number || `#APP-${String(application.id).padStart(4, '0')}`);
  const requestedDocs = documents.filter((d) => d.status === 'requested');

  const DOC_TYPES = [
    { key: 'drivers_license', label: "Driver's License" },
    { key: 'proof_income', label: 'Proof of Income' },
    { key: 'proof_address', label: 'Proof of Residence' },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Application Status</h1>
      <p className="text-lg font-medium mb-4">Application {appId}</p>

      {/* Stepper */}
      <section data-testid="stepper" className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex justify-between mb-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= stepIndex ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Current Status</p>
            <span data-testid="status-badge" className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-700'}`}>
              {status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-sm">{new Date(lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
        {STATUS_DESC[status] && (
          <div data-testid="status-desc" className="mt-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">{STATUS_DESC[status]}</div>
        )}
      </section>

      {/* Pending Documents Alert */}
      {status === 'pending_documents' && requestedDocs.length > 0 && (
        <section data-testid="pending-docs-alert" className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="font-semibold text-amber-800 mb-1">Action Required</p>
          <p className="text-sm text-amber-700 mb-2">Additional documents have been requested.</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
          <div className="flex gap-2 flex-wrap">
            {requestedDocs.map((doc) => (
              <button key={doc.id} onClick={() => handleUploadClick(doc.doc_type)} disabled={uploading}
                className="text-sm px-3 py-1 border border-amber-400 rounded-lg text-amber-800 hover:bg-amber-100 disabled:opacity-50">
                {uploading && uploadingType === doc.doc_type ? 'Uploading...' : `Upload ${doc.doc_type.replace(/_/g, ' ')}`}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Application Details */}
      <section data-testid="app-details" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Application Details</h2>
        <dl className="space-y-2">
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Vehicle</dt><dd className="text-sm">{car.year} {car.make} {car.model}</dd></div>
          <hr />
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Loan Amount</dt><dd className="text-sm">${loanAmount.toLocaleString()}</dd></div>
          <hr />
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Term</dt><dd className="text-sm">{term} months</dd></div>
          <hr />
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Monthly Payment</dt><dd className="text-sm font-semibold">${monthly.toFixed(2)}</dd></div>
        </dl>
      </section>

      {/* Documents Checklist */}
      <section data-testid="documents-section" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Documents</h2>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
        <ul className="space-y-2">
          {DOC_TYPES.map((dt) => {
            const doc = documents.find((d) => d.doc_type === dt.key && d.status !== 'requested' && d.file_attached);
            return (
              <li key={dt.key} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${doc ? 'text-green-600' : 'text-gray-300'}`}>{doc ? '✓' : '○'}</span>
                  <span className="text-sm">{dt.label}</span>
                  {doc?.file_name && <span className="text-xs text-gray-400">{doc.file_name}</span>}
                </div>
                {doc && (
                  <button onClick={() => handleUploadClick(dt.key)} disabled={uploading}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50">Replace</button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Status History */}
      <section data-testid="history-section" className="bg-white rounded-xl border p-6 mb-4">
        <h2 className="text-base font-semibold mb-3">Status History</h2>
        <ul className="space-y-2 text-sm">
          {typeof app.submitted_at === 'string' && (
            <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Submitted — {new Date(app.submitted_at).toLocaleDateString()}</li>
          )}
          <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Draft Created — {new Date(application.created_at).toLocaleDateString()}</li>
        </ul>
      </section>

      <Link href={`/dashboard/applications/${id}`} className="text-sm text-blue-600 hover:underline mr-4">← Back to Application</Link>
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
    </main>
  );
}
