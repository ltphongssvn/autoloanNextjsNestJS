// apps/frontend/src/components/DocumentUpload.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Doc {
  id: number;
  doc_type: string;
  file_name: string;
  status: string;
  uploaded_at?: string;
  rejection_note?: string;
}

const DOC_TYPES = [
  { value: 'drivers_license', label: 'Driver\'s License' },
  { value: 'proof_income', label: 'Proof of Income' },
  { value: 'proof_address', label: 'Proof of Address' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'vehicle_purchase', label: 'Vehicle Purchase Agreement' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  requested: 'bg-blue-100 text-blue-700',
};

export default function DocumentUpload({ applicationId }: { applicationId: number }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [docType, setDocType] = useState('drivers_license');
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isStaff = user?.role === 'loan_officer' || user?.role === 'underwriter';

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await api.documents.list(applicationId);
        setDocuments(Array.isArray(res) ? res : res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocs();
  }, [applicationId]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      const newDoc = await api.documents.upload(applicationId, formData);
      setDocuments((prev) => [newDoc.data ?? newDoc, ...prev]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerify = async (docId: number) => {
    try {
      const updated = await api.documents.updateStatus(docId, 'verified');
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, ...updated, status: 'verified' } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document');
    }
  };

  const handleReject = async (docId: number) => {
    try {
      const updated = await api.documents.updateStatus(docId, 'rejected');
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, ...updated, status: 'rejected' } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject document');
    }
  };

  if (isLoading) return <div role="status" className="text-sm text-gray-500">Loading documents...</div>;
  if (error) return <div role="alert" className="text-sm text-red-600">{error}</div>;

  return (
    <section data-testid="documents-section" className="bg-white rounded-xl border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Documents</h2>
      <div data-testid="upload-form" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="doc-type" className="block text-sm font-medium mb-1">Document type</label>
          <select id="doc-type" value={docType} onChange={(e) => setDocType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium mb-1">File upload</label>
          <input id="file-upload" type="file" ref={fileRef} className="text-sm" />
        </div>
        <button onClick={handleUpload} disabled={isUploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">{isUploading ? 'Uploading...' : 'Upload'}</button>
      </div>
      {documents.length === 0 ? (
        <p data-testid="no-docs" className="text-sm text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} data-testid="doc-item" className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{doc.file_name}</p>
                <p className="text-xs text-gray-500">{doc.doc_type.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span data-testid="doc-status" className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[doc.status] || 'bg-gray-100 text-gray-700'}`}>{doc.status}</span>
                {isStaff && doc.status === 'pending' && (
                  <div className="flex gap-1" data-testid="doc-actions">
                    <button onClick={() => handleVerify(doc.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition">Verify</button>
                    <button onClick={() => handleReject(doc.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition">Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
