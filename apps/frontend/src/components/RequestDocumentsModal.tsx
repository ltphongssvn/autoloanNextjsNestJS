'use client';
import { useState } from 'react';
import { api } from '../services/api';

interface RequestDocumentsModalProps {
  applicationId: number;
  applicationNumber?: string;
  role: 'loan_officer' | 'underwriter';
  onClose: () => void;
  onSuccess: () => void;
}

const DOC_TYPES = [
  { id: 'bank_statement', label: 'Bank Statements (3 months)' },
  { id: 'other_tax', label: 'Tax Returns' },
  { id: 'proof_income', label: 'Additional Pay Stubs' },
  { id: 'insurance', label: 'Proof of Insurance' },
  { id: 'vehicle_purchase', label: 'Vehicle Purchase Agreement' },
  { id: 'other', label: 'Other' },
];

export default function RequestDocumentsModal({ applicationId, applicationNumber, role, onClose, onSuccess }: RequestDocumentsModalProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const appLabel = applicationNumber || `#APP-${String(applicationId).padStart(4, '0')}`;

  const toggleDoc = (id: string) =>
    setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  const handleSend = async () => {
    if (selectedDocs.length === 0) { setError('Select at least one document type'); return; }
    setSending(true);
    setError('');
    const documentRequests = selectedDocs.map((docType) => ({
      doc_type: docType === 'other_tax' ? 'other' : docType,
      note: docType === 'other' && otherText ? otherText : notes,
    }));
    try {
      const fn = role === 'loan_officer' ? api.loanOfficer.requestDocuments : api.underwriter.requestDocuments;
      await fn(applicationId, { document_requests: documentRequests, notes });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="request-docs-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold mb-1">Request Additional Documents</h2>
        <p className="text-sm text-gray-500 mb-4">Application {appLabel}</p>

        {error && <div role="alert" className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        <p className="text-sm font-medium mb-2">Select documents to request:</p>
        <div className="space-y-1 mb-4">
          {DOC_TYPES.map((doc) => (
            <div key={doc.id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)} />
                {doc.label}
              </label>
              {doc.id === 'other' && selectedDocs.includes('other') && (
                <input type="text" placeholder="Specify document type..." value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="ml-6 mt-1 w-full px-2 py-1 border rounded text-sm" />
              )}
            </div>
          ))}
        </div>

        <p className="text-sm font-medium mb-2">Notes to applicant:</p>
        <textarea aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Please provide bank statements..." rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm resize-none mb-4" />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} disabled={sending} data-testid="send-btn"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
