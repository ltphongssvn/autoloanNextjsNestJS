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
  user?: { first_name: string; last_name: string };
}

interface NotesListProps {
  applicationId: number;
}

export default function NotesList({ applicationId }: NotesListProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
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
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.notes.create(applicationId, { note: newNote, internal: isInternal });
      const created = res.data ?? res;
      setNotes((prev) => [created, ...prev]);
      setNewNote('');
      setIsInternal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div role="status">Loading notes...</div>;
  if (error) return <div role="alert">{error}</div>;

  return (
    <section aria-label="Notes">
      <h2>Notes</h2>
      {isStaff && (
        <div data-testid="note-form">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            aria-label="Note text"
          />
          <label>
            <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
            Internal only
          </label>
          <button onClick={handleSubmit} disabled={isSubmitting || !newNote.trim()}>
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      )}
      {notes.length === 0 ? (
        <p data-testid="no-notes">No notes yet.</p>
      ) : (
        <ul>
          {notes.map((note) => (
            <li key={note.id} data-testid="note-item">
              <p>{note.note}</p>
              {note.internal && <span data-testid="internal-badge">Internal</span>}
              <small>
                {note.user ? `${note.user.first_name} ${note.user.last_name}` : 'Unknown'} — {new Date(note.created_at).toLocaleDateString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
