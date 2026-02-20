// apps/frontend/src/components/DocumentUpload.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { LoanDocument } from '@autoloan/shared-types';

const DOC_TYPES = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'proof_income', label: 'Proof of Income' },
  { value: 'proof_address', label: 'Proof of Address' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'vehicle_purchase', label: 'Vehicle Purchase Agreement' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

interface DocumentUploadProps {
  applicationId: number;
}

export default function DocumentUpload({ applicationId }: DocumentUploadProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [docType, setDocType] = useState('drivers_license');
  const [isUploading, setIsUploading] = useState(false);

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
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      const res = await api.documents.upload(applicationId, formData);
      const created = res.data ?? res;
      setDocuments((prev) => [created, ...prev]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerify = async (docId: number) => {
    try {
      await api.documents.updateStatus(docId, 'verified');
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, status: 'verified' as const } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document');
    }
  };

  const handleReject = async (docId: number) => {
    try {
      await api.documents.updateStatus(docId, 'rejected');
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, status: 'rejected' as const } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject document');
    }
  };

  if (isLoading) return <div role="status">Loading documents...</div>;
  if (error) return <div role="alert">{error}</div>;

  return (
    <section aria-label="Documents">
      <h2>Documents</h2>
      <div data-testid="upload-form">
        <select value={docType} onChange={(e) => setDocType(e.target.value)} aria-label="Document type">
          {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input type="file" ref={fileRef} aria-label="File upload" />
        <button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {documents.length === 0 ? (
        <p data-testid="no-docs">No documents uploaded yet.</p>
      ) : (
        <ul>
          {documents.map((doc) => (
            <li key={doc.id} data-testid="doc-item">
              <span>{doc.file_name}</span>
              <span data-testid="doc-status">{doc.status}</span>
              {isStaff && doc.status === 'pending' && (
                <span data-testid="doc-actions">
                  <button onClick={() => handleVerify(doc.id)}>Verify</button>
                  <button onClick={() => handleReject(doc.id)}>Reject</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
