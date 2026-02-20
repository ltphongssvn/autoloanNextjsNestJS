// apps/frontend/src/components/StatusHistory.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { StatusHistory } from '@autoloan/shared-types';

interface StatusHistoryProps {
  applicationId: number;
}

export default function StatusHistoryList({ applicationId }: StatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
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

  if (isLoading) return <div role="status">Loading history...</div>;
  if (error) return <div role="alert">{error}</div>;
  if (history.length === 0) return <p>No status changes yet.</p>;

  return (
    <section aria-label="Status History">
      <h2>Status History</h2>
      <ul>
        {history.map((entry) => (
          <li key={entry.id} data-testid="history-entry">
            <strong>{entry.from_status ?? 'N/A'}</strong> → <strong>{entry.to_status ?? 'N/A'}</strong>
            {entry.comment && <span> — {entry.comment}</span>}
            <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString()}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
