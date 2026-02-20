// apps/frontend/src/components/StatusHistory.tsx
'use client';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface StatusChange {
  id: number;
  from_status: string | null;
  to_status: string;
  comment?: string;
  created_at: string;
  changed_by?: { full_name?: string };
}

export default function StatusHistoryList({ applicationId }: { applicationId: number }) {
  const [history, setHistory] = useState<StatusChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await api.applications.history(applicationId);
        setHistory(Array.isArray(res) ? res : res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [applicationId]);

  if (isLoading) return <div role="status" className="text-sm text-gray-500">Loading history...</div>;
  if (error) return <div role="alert" className="text-sm text-red-600">{error}</div>;

  return (
    <section data-testid="status-history" className="bg-white rounded-xl border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Status History</h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-500">No status changes yet.</p>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id} data-testid="history-entry" className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium">
                  {<><span className="text-gray-500">{entry.from_status ? entry.from_status.replace(/_/g, ' ') : 'N/A'}</span> → <span className="text-gray-900">{entry.to_status ? entry.to_status.replace(/_/g, ' ') : 'N/A'}</span></>}
                </p>
                {entry.comment && <p className="text-gray-600 mt-0.5">{entry.comment}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(entry.created_at).toLocaleString()}
                  {entry.changed_by?.full_name && <> · {entry.changed_by.full_name}</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
