// apps/frontend/src/components/NotesList.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Note {
  id: number;
  note: string;
  internal: boolean;
  created_at: string;
  user?: { full_name?: string };
}

export default function NotesList({ applicationId }: { applicationId: number }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStaff = user?.role === 'loan_officer' || user?.role === 'underwriter';

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await api.notes.list(applicationId);
        setNotes(Array.isArray(res) ? res : res.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notes');
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotes();
  }, [applicationId]);

  const handleSubmit = async () => {
    if (!noteText.trim()) return;
    setIsSubmitting(true);
    try {
      const newNote = await api.notes.create(applicationId, { note: noteText, internal: isInternal });
      setNotes((prev) => [newNote, ...prev]);
      setNoteText('');
      setIsInternal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div role="status" className="text-sm text-gray-500">Loading notes...</div>;
  if (error) return <div role="alert" className="text-sm text-red-600">{error}</div>;

  return (
    <section data-testid="notes-section" className="bg-white rounded-xl border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Notes</h2>
      {isStaff && (
        <div data-testid="note-form" className="mb-4 space-y-2">
          <textarea aria-label="Note text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none" rows={3} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
              Internal only
            </label>
            <button onClick={handleSubmit} disabled={isSubmitting || !noteText.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">{isSubmitting ? 'Adding...' : 'Add Note'}</button>
          </div>
        </div>
      )}
      {notes.length === 0 ? (
        <p data-testid="no-notes" className="text-sm text-gray-500">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} data-testid="note-item" className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{note.user?.full_name ?? 'Unknown'}</span>
                {note.internal && <span data-testid="internal-badge" className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Internal</span>}
                <span className="text-xs text-gray-400 ml-auto">{new Date(note.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
