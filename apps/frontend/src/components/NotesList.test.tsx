// apps/frontend/src/components/NotesList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NotesList from './NotesList';

const mockNotesList = vi.fn();
const mockNotesCreate = vi.fn();
vi.mock('../services/api', () => ({
  api: {
    notes: {
      list: (...args: unknown[]) => mockNotesList(...args),
      create: (...args: unknown[]) => mockNotesCreate(...args),
    },
  },
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const sampleNotes = [
  { id: 1, note: 'Review complete', internal: false, created_at: '2026-01-01T00:00:00Z', user: { first_name: 'Jane', last_name: 'Doe' } },
  { id: 2, note: 'Internal memo', internal: true, created_at: '2026-01-02T00:00:00Z', user: null },
];

describe('NotesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 1, role: 'customer' } });
  });

  it('should show loading state', () => {
    mockNotesList.mockReturnValue(new Promise(() => {}));
    render(<NotesList applicationId={1} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading notes...');
  });

  it('should render notes', async () => {
    mockNotesList.mockResolvedValue({ data: sampleNotes });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getAllByTestId('note-item')).toHaveLength(2));
    expect(screen.getByText('Review complete')).toBeInTheDocument();
  });

  it('should render with array response', async () => {
    mockNotesList.mockResolvedValue(sampleNotes);
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getAllByTestId('note-item')).toHaveLength(2));
  });

  it('should show internal badge', async () => {
    mockNotesList.mockResolvedValue({ data: [sampleNotes[1]] });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('internal-badge')).toHaveTextContent('Internal'));
  });

  it('should show Unknown for missing user', async () => {
    mockNotesList.mockResolvedValue({ data: [sampleNotes[1]] });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByText(/Unknown/)).toBeInTheDocument());
  });

  it('should show empty state', async () => {
    mockNotesList.mockResolvedValue({ data: [] });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('no-notes')).toHaveTextContent('No notes yet.'));
  });

  it('should show error', async () => {
    mockNotesList.mockRejectedValue(new Error('Network error'));
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  it('should handle non-Error failure', async () => {
    mockNotesList.mockRejectedValue('fail');
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load notes'));
  });

  it('should hide form for customers', async () => {
    mockNotesList.mockResolvedValue({ data: [] });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('no-notes')).toBeInTheDocument());
    expect(screen.queryByTestId('note-form')).toBeNull();
  });

  it('should show form for staff', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockNotesList.mockResolvedValue({ data: [] });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
  });

  it('should submit a note', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'underwriter' } });
    mockNotesList.mockResolvedValue({ data: [] });
    mockNotesCreate.mockResolvedValue({ data: { id: 3, note: 'New note', internal: false, created_at: '2026-01-03T00:00:00Z', user: { first_name: 'Bob', last_name: 'Smith' } } });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'New note' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(screen.getByText('New note')).toBeInTheDocument());
  });

  it('should submit with res fallback', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockNotesList.mockResolvedValue({ data: [] });
    mockNotesCreate.mockResolvedValue({ id: 4, note: 'Direct', internal: false, created_at: '2026-01-04T00:00:00Z', user: null });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Direct' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(screen.getByText('Direct')).toBeInTheDocument());
  });

  it('should toggle internal checkbox', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockNotesList.mockResolvedValue({ data: [] });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
    const checkbox = screen.getByLabelText('Internal only');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('should not submit empty note', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockNotesList.mockResolvedValue({ data: [] });
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
    expect(screen.getByText('Add Note')).toBeDisabled();
  });

  it('should show error on submit failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockNotesList.mockResolvedValue({ data: [] });
    mockNotesCreate.mockRejectedValue(new Error('Forbidden'));
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Forbidden'));
  });

  it('should handle non-Error submit failure', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockNotesList.mockResolvedValue({ data: [] });
    mockNotesCreate.mockRejectedValue('fail');
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to add note'));
  });

  it('should show submitting state', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 2, role: 'loan_officer' } });
    mockNotesList.mockResolvedValue({ data: [] });
    mockNotesCreate.mockReturnValue(new Promise(() => {}));
    render(<NotesList applicationId={1} />);
    await waitFor(() => expect(screen.getByTestId('note-form')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add Note'));
    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });
});
