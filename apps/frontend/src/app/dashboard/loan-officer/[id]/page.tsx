'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../services/api';
import RequestDocumentsModal from '../../../../components/RequestDocumentsModal';
import type { Application } from '@autoloan/shared-types';

interface Note { id: number; note: string; internal: boolean; created_at: string; user_id: number }
interface Doc { id: number; doc_type: string; status: string; file_url?: string }

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  return <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium">{value || '—'}</p></div>;
}

export default function LoanOfficerReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [actionLoading, setActionLoading] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [showRequestDocs, setShowRequestDocs] = useState(false);
  const [verification, setVerification] = useState({ ageVerified: false, idMatches: false, residencyConfirmed: false, employmentVerified: false, documentsLegible: false });

  const loadNotes = useCallback(async () => {
    try { const res = await api.loanOfficer.getNotes(Number(id)); setNotes(Array.isArray(res) ? res : res.data ?? []); } catch { /* ignore */ }
  }, [id]);

  const loadDocuments = useCallback(async () => {
    try { const res = await api.documents.list(Number(id)); setDocuments(Array.isArray(res) ? res : res.data ?? []); } catch { /* ignore */ }
  }, [id]);

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
    loadNotes();
    loadDocuments();
  }, [id, loadNotes, loadDocuments]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    setError('');
    try {
      let res;
      if (action === 'start-verification') res = await api.loanOfficer.startVerification(Number(id));
      else if (action === 'review') res = await api.loanOfficer.review(Number(id));
      if (res) setApplication(res.data ?? res);
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
      loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const handleDecisionSubmit = async () => {
    if (!selectedAction) return;
    if (selectedAction === 'request_docs') { setShowRequestDocs(true); return; }
    if (decisionNotes.trim()) {
      try { await api.loanOfficer.addNote(Number(id), decisionNotes, true); } catch { /* ignore */ }
    }
    await handleAction(selectedAction === 'start_verification' ? 'start-verification' : 'review');
    setSelectedAction('');
    setDecisionNotes('');
  };

  const handleDeleteDoc = async (docId: number) => {
    try { await api.documents.remove(docId); loadDocuments(); } catch { /* ignore */ }
  };

  const formatDocType = (t: string) => t.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !application) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const app = application as unknown as Record<string, unknown>;
  const personal = (app.personal_info as Record<string, string>) || {};
  const car = (app.car_details as Record<string, string>) || {};
  const loan = (app.loan_details as Record<string, string>) || {};
  const employment = (app.employment_info as Record<string, string>) || {};
  const appNum = String(app.application_number || `#APP-${String(application.id).padStart(4, '0')}`);
  const loanAmount = Number(loan.amount || application.loan_amount || 0);
  const downPayment = Number(loan.down_payment || application.down_payment || 0);
  const principal = loanAmount - downPayment;
  const vehiclePrice = Number(car.price || 0);
  const income = Number(employment.income || 0);
  const term = application.loan_term || 48;
  const apr = Number(app.interest_rate || 6.9);
  const monthlyRate = apr / 100 / 12;
  const monthly = Number(app.monthly_payment) || (monthlyRate > 0 ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, term))) / (Math.pow(1 + monthlyRate, term) - 1) : 0);
  const ltv = vehiclePrice > 0 ? ((principal / vehiclePrice) * 100).toFixed(0) : '0';
  const dti = income > 0 ? (((monthly * 12) / income) * 100).toFixed(0) : '0';

  const CHECKS = [
    { key: 'ageVerified' as const, label: 'Applicant 18+' },
    { key: 'idMatches' as const, label: 'ID matches' },
    { key: 'residencyConfirmed' as const, label: 'Residency confirmed' },
    { key: 'employmentVerified' as const, label: 'Employment verified' },
    { key: 'documentsLegible' as const, label: 'Documents legible' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/dashboard/loan-officer')} className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Back to Dashboard</button>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Review Application {appNum}</h1>
        <span data-testid="status-badge" className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700">{application.status.replace(/_/g, ' ').toUpperCase()}</span>
      </div>

      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Applicant Info */}
          <section data-testid="applicant-section" className="bg-white rounded-xl border-l-4 border-l-green-500 border p-6">
            <h2 className="text-base font-semibold mb-3">Applicant Info</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoRow label="Name" value={`${personal.first_name || ''} ${personal.last_name || ''}`.trim()} />
              <InfoRow label="DOB" value={personal.dob} />
              <InfoRow label="SSN" value={personal.ssn ? `***-**-${personal.ssn.slice(-4)}` : undefined} />
              <InfoRow label="Phone" value={personal.phone} />
              <InfoRow label="Email" value={personal.email} />
              <InfoRow label="Address" value={personal.address ? `${personal.address}, ${personal.city}, ${personal.state} ${personal.zip}` : undefined} />
            </div>
          </section>

          {/* Vehicle Info */}
          <section data-testid="vehicle-section" className="bg-white rounded-xl border-l-4 border-l-blue-500 border p-6">
            <h2 className="text-base font-semibold mb-3">Vehicle Info</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoRow label="Make" value={car.make} />
              <InfoRow label="Model" value={car.model} />
              <InfoRow label="Year" value={car.year} />
              <InfoRow label="VIN" value={car.vin} />
              <InfoRow label="Condition" value={car.condition} />
              <InfoRow label="Value" value={vehiclePrice > 0 ? `$${vehiclePrice.toLocaleString()}` : undefined} />
            </div>
          </section>

          {/* Loan Details */}
          <section data-testid="loan-section" className="bg-white rounded-xl border-l-4 border-l-indigo-500 border p-6">
            <h2 className="text-base font-semibold mb-3">Loan Details</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <InfoRow label="Amount" value={`$${loanAmount.toLocaleString()}`} />
              <InfoRow label="Down" value={`$${downPayment.toLocaleString()}`} />
              <InfoRow label="Term" value={`${term} mo`} />
              <InfoRow label="APR" value={`${apr}%`} />
              <InfoRow label="Monthly" value={`$${monthly.toFixed(2)}`} />
              <InfoRow label="LTV" value={`${ltv}%`} />
            </div>
          </section>

          {/* Employment */}
          <section data-testid="employment-section" className="bg-white rounded-xl border-l-4 border-l-red-500 border p-6">
            <h2 className="text-base font-semibold mb-3">Employment & Financial</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <InfoRow label="Employer" value={employment.employer} />
              <InfoRow label="Title" value={employment.job_title} />
              <InfoRow label="Years" value={employment.years} />
              <InfoRow label="Income" value={income > 0 ? `$${income.toLocaleString()}/yr` : undefined} />
              <InfoRow label="DTI" value={`${dti}%`} />
            </div>
          </section>

          {/* Documents Table */}
          <section data-testid="documents-section" className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold mb-3">Documents</h2>
            {documents.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Document</th><th className="pb-2">Status</th><th className="pb-2">Actions</th></tr></thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="py-2">{formatDocType(doc.doc_type)}</td>
                      <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{doc.status}</span></td>
                      <td className="py-2 flex gap-2">
                        {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">View</a>}
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          {/* Verification Checklist */}
          <section data-testid="verification-section" className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold mb-3">Verification Checklist</h2>
            <div className="space-y-1">
              {CHECKS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={verification[c.key]} onChange={(e) => setVerification({ ...verification, [c.key]: e.target.checked })} />
                  {c.label}
                </label>
              ))}
            </div>
          </section>

          {/* Internal Notes */}
          <section data-testid="notes-section" className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold mb-3">Internal Notes</h2>
            <textarea aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note..." rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none mb-2" />
            <button onClick={handleAddNote} className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50">Add Note</button>
            {notes.length > 0 && <hr className="my-3" />}
            {notes.map((n) => (
              <div key={n.id} className="mb-2 p-2 bg-gray-50 rounded text-sm">
                <p>{n.note}</p>
                <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </section>

          {/* Decision Center */}
          <section data-testid="decision-section" className="bg-amber-50 rounded-xl border border-amber-200 p-6">
            <h2 className="text-base font-semibold mb-3">Decision Center</h2>
            <select aria-label="Action" value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3">
              <option value="">-- Select --</option>
              {application.status === 'submitted' && <option value="start_verification">Start Verification</option>}
              <option value="request_docs">Request Documents</option>
              {(application.status === 'submitted' || application.status === 'pending') && <option value="review">Forward to Underwriter</option>}
            </select>
            <textarea aria-label="Decision notes" value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} placeholder="Notes..." rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none mb-3" />
            <button onClick={handleDecisionSubmit} disabled={!selectedAction || !!actionLoading} data-testid="decision-btn"
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              Submit Decision
            </button>
          </section>
        </div>
      </div>

      {showRequestDocs && (
        <RequestDocumentsModal applicationId={Number(id)} applicationNumber={appNum} role="loan_officer"
          onClose={() => setShowRequestDocs(false)} onSuccess={() => { loadDocuments(); }} />
      )}
    </main>
  );
}
