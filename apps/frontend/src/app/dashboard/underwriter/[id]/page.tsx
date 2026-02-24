'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../services/api';
import type { Application } from '@autoloan/shared-types';

interface Note { id: number; note: string; created_at: string; }

const REJECTION_REASONS = [
  'Debt-to-income ratio too high',
  'Insufficient income',
  'Loan-to-value ratio too high',
  'Employment history insufficient',
  'Unable to verify information',
  'Other',
];
const DOCUMENT_TYPES = [
  { id: 'proof_of_income', label: 'Proof of Income (Pay Stubs)' },
  { id: 'bank_statements', label: 'Bank Statements (Last 3 months)' },
  { id: 'tax_returns', label: 'Tax Returns (Last 2 years)' },
  { id: 'employment_verification', label: 'Employment Verification Letter' },
  { id: 'id_verification', label: 'Government ID' },
  { id: 'proof_of_residence', label: 'Proof of Residence' },
  { id: 'vehicle_info', label: 'Vehicle Purchase Agreement' },
  { id: 'insurance', label: 'Proof of Insurance' },
];

export default function UnderwriterAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [officerNotes, setOfficerNotes] = useState<Note[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [loanTerm, setLoanTerm] = useState('48');
  const [interestRate, setInterestRate] = useState('6.9');
  const [approvalConditions, setApprovalConditions] = useState('Standard terms apply');
  const [rejectReason, setRejectReason] = useState('');
  const [additionalExplanation, setAdditionalExplanation] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [docsNotes, setDocsNotes] = useState('');

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

  const loadOfficerNotes = useCallback(async () => {
    try {
      const res = await api.underwriter.getNotes(Number(id));
      setOfficerNotes(res.data || []);
    } catch { setOfficerNotes([]); }
  }, [id]);

  useEffect(() => { loadOfficerNotes(); }, [loadOfficerNotes]);

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !application) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const a = application as unknown as Record<string, unknown>;
  const personal = (a.personal_info as Record<string, string>) || {};
  const car = (a.car_details as Record<string, string>) || {};
  const loan = (a.loan_details as Record<string, string>) || {};
  const employment = (a.employment_info as Record<string, string>) || {};

  const getAppId = () => String(application.application_number || `#APP-${String(application.id).padStart(4, '0')}`);

  const loanAmount = Number(loan.amount || application.loan_amount || 0);
  const downPayment = Number(loan.down_payment || application.down_payment || 0);
  const vehiclePrice = Number(car.price || 0);
  const annualIncome = Number(employment.income || 0);
  const principal = loanAmount - downPayment;
  const term = Number(loanTerm);
  const rate = Number(interestRate);
  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = principal > 0 && monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
    : 0;
  const totalRepayment = monthlyPayment * term;
  const totalInterest = totalRepayment - principal;
  const dtiRatio = annualIncome > 0 ? Math.round(((monthlyPayment * 12) / annualIncome) * 100) : 0;
  const ltvRatio = vehiclePrice > 0 ? Math.round((principal / vehiclePrice) * 100) : 0;
  const employmentYears = Number(employment.years || 0);
  const dtiPass = dtiRatio < 43;
  const ltvPass = ltvRatio < 90;
  const employmentPass = employmentYears >= 2;
  const incomePass = annualIncome > 0;

  const dob = personal.dob ? new Date(personal.dob) : null;
  let age: number | string = '—';
  if (dob && !isNaN(dob.getTime())) age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const handleApprove = async () => {
    try {
      await api.underwriter.approve(Number(id), {
        loan_term: term,
        interest_rate: rate,
        monthly_payment: Number(monthlyPayment.toFixed(2)),
        decision_notes: decisionNotes,
        approval_conditions: approvalConditions,
      });
      setShowApproveModal(false);
      router.push('/dashboard/underwriter');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert('Please select a rejection reason'); return; }
    const fullReason = additionalExplanation ? `${rejectReason}: ${additionalExplanation}` : rejectReason;
    try {
      await api.underwriter.reject(Number(id), { rejection_reason: fullReason, decision_notes: decisionNotes });
      setShowRejectModal(false);
      router.push('/dashboard/underwriter');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const handleRequestDocs = async () => {
    try {
      await api.underwriter.requestDocuments(Number(id), { documents: selectedDocs, notes: docsNotes || 'Additional documents required' });
      setShowDocsModal(false);
      setSelectedDocs([]);
      setDocsNotes('');
      loadOfficerNotes();
      alert('Documents requested successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request documents');
    }
  };

  const handleDocToggle = (docId: string) =>
    setSelectedDocs((prev) => prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]);

  const RiskItem = ({ label, value, target, pass, showBar, percent }: { label: string; value: string; target: string; pass: boolean; showBar?: boolean; percent?: number }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">{value}</span>
          <span className={`text-lg ${pass ? 'text-green-600' : 'text-red-600'}`}>{pass ? '✓' : '✗'}</span>
        </div>
      </div>
      {showBar && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${pass ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(percent || 0, 100)}%` }} />
        </div>
      )}
      <span className="text-xs text-gray-500">{target}</span>
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Financial Analysis</h1>
      </div>

      <button onClick={() => router.push('/dashboard/underwriter')} className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Back to Dashboard</button>

      <h2 className="text-lg font-semibold mb-4">Application {getAppId()} - {application.status.replace(/_/g, ' ').toUpperCase()}</h2>

      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold mb-4">RISK ASSESSMENT</h3>
            <RiskItem label="Debt-to-Income Ratio" value={`${dtiRatio}%`} target="Target: < 43%" pass={dtiPass} showBar percent={dtiRatio} />
            <RiskItem label="Loan-to-Value Ratio" value={`${ltvRatio}%`} target="Target: < 90%" pass={ltvPass} showBar percent={ltvRatio} />
            <RiskItem label="Employment Stability" value={`${employmentYears} years`} target="Target: > 2 years" pass={employmentPass} />
            <RiskItem label="Income Verification" value={`$${annualIncome.toLocaleString()}/yr`} target="Verified" pass={incomePass} />
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold mb-4">APPLICANT SUMMARY</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {personal.first_name} {personal.last_name}</p>
                <p><strong>Age:</strong> {age}</p>
                <p><strong>Income:</strong> ${annualIncome.toLocaleString()}/yr</p>
                <Link href={`/dashboard/underwriter/${id}/review`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">View Full Application</Link>
              </div>
              <div>
                <p><strong>Vehicle:</strong> {car.year} {car.make} {car.model}</p>
                <p><strong>Value:</strong> ${vehiclePrice.toLocaleString()}</p>
                <p><strong>Down:</strong> ${downPayment.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {officerNotes.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold mb-4">OFFICER NOTES</h3>
              {officerNotes.map((n) => (
                <div key={n.id} className="mb-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm"><em>{new Date(n.created_at).toLocaleDateString()}</em> - {n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="font-bold mb-4">LOAN CALCULATION</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Principal:</span><span className="font-semibold">${principal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Interest Rate:</span><span className="font-semibold">{rate}% APR</span></div>
              <div className="flex justify-between"><span>Term:</span><span className="font-semibold">{term} months</span></div>
              <div className="flex justify-between"><span>Monthly Payment:</span><span className="font-semibold">${monthlyPayment.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Total Interest:</span><span className="font-semibold">${totalInterest.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Total Repayment:</span><span className="font-semibold">${totalRepayment.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
            <h3 className="font-bold mb-4">UNDERWRITER DECISION</h3>
            <div className="mb-4">
              <label htmlFor="decision-notes" className="block text-sm font-medium mb-1">Decision Notes</label>
              <textarea id="decision-notes" rows={3} value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none bg-white" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDocsModal(true)} className="flex-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition">Docs</button>
              <button onClick={() => setShowRejectModal(true)} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">Reject</button>
              <button onClick={() => setShowApproveModal(true)} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">Approve</button>
            </div>
          </div>
        </div>
      </div>

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowApproveModal(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Approve Application</h2>
            <p className="mb-1"><strong>Application:</strong> {getAppId()}</p>
            <p className="mb-1"><strong>Applicant:</strong> {personal.first_name} {personal.last_name}</p>
            <p className="mb-4"><strong>Loan:</strong> ${principal.toLocaleString()}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="approve-term" className="block text-sm font-medium mb-1">Term</label>
                <select id="approve-term" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                  <option value="72">72 months</option>
                </select>
              </div>
              <div>
                <label htmlFor="approve-apr" className="block text-sm font-medium mb-1">APR %</label>
                <input id="approve-apr" type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="approve-conditions" className="block text-sm font-medium mb-1">Conditions</label>
              <input id="approve-conditions" value={approvalConditions} onChange={(e) => setApprovalConditions(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleApprove} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Confirm Approval</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Reject Application</h2>
            <p className="mb-1"><strong>Application:</strong> {getAppId()}</p>
            <p className="mb-4"><strong>Applicant:</strong> {personal.first_name} {personal.last_name}</p>
            <p className="text-sm font-medium mb-2">Rejection Reason (required):</p>
            <div className="space-y-1 mb-4">
              {REJECTION_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reject-reason" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} />
                  {r}
                </label>
              ))}
            </div>
            <div className="mb-4">
              <label htmlFor="reject-explanation" className="block text-sm font-medium mb-1">Additional Explanation</label>
              <textarea id="reject-explanation" rows={3} value={additionalExplanation} onChange={(e) => setAdditionalExplanation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDocsModal(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Request Documents</h2>
            <p className="mb-1"><strong>Application:</strong> {getAppId()}</p>
            <p className="mb-4"><strong>Applicant:</strong> {personal.first_name} {personal.last_name}</p>
            <p className="text-sm font-medium mb-2">Select Documents to Request:</p>
            <div className="space-y-1 mb-4">
              {DOCUMENT_TYPES.map((doc) => (
                <label key={doc.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedDocs.includes(doc.id)} onChange={() => handleDocToggle(doc.id)} />
                  {doc.label}
                </label>
              ))}
            </div>
            <div className="mb-4">
              <label htmlFor="docs-notes" className="block text-sm font-medium mb-1">Notes for Applicant</label>
              <textarea id="docs-notes" rows={2} value={docsNotes} onChange={(e) => setDocsNotes(e.target.value)}
                placeholder="Please provide the requested documents..."
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDocsModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleRequestDocs} disabled={selectedDocs.length === 0}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Request Documents</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
