import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ApiKeysPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('../../../../services/api', () => ({
  api: { apiKeys: { list: vi.fn(), create: vi.fn(), revoke: vi.fn(), remove: vi.fn() } },
}));

import { api } from '../../../../services/api';
const mockList = vi.mocked(api.apiKeys.list);
const mockCreate = vi.mocked(api.apiKeys.create);
const mockRevoke = vi.mocked(api.apiKeys.revoke);
const mockRemove = vi.mocked(api.apiKeys.remove);

describe('ApiKeysPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows loading then empty state', async () => {
    mockList.mockResolvedValue([]);
    render(<ApiKeysPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('No API keys yet.')).toBeInTheDocument());
  });

  it('shows keys list', async () => {
    mockList.mockResolvedValue([{ id: 1, name: 'Test Key', active: true }, { id: 2, name: 'Old Key', active: false }]);
    render(<ApiKeysPage />);
    await waitFor(() => expect(screen.getByTestId('keys-list')).toBeInTheDocument());
    expect(screen.getByText('Test Key')).toBeInTheDocument();
    expect(screen.getByText('Old Key')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });

  it('shows error on list failure', async () => {
    mockList.mockRejectedValue(new Error('load fail'));
    render(<ApiKeysPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('load fail'));
  });

  it('creates key and shows plain key', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 1, name: 'New', key: 'ak_test123' }); // pragma: allowlist secret
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByPlaceholderText('Key name'));
    fireEvent.change(screen.getByPlaceholderText('Key name'), { target: { value: 'New' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(screen.getByTestId('new-key')).toHaveTextContent('ak_test123'));
  });

  it('skips create with empty name', async () => {
    mockList.mockResolvedValue([]);
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByText('Create'));
    fireEvent.click(screen.getByText('Create'));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('handles create error', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockRejectedValue(new Error('create fail'));
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByPlaceholderText('Key name'));
    fireEvent.change(screen.getByPlaceholderText('Key name'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('create fail'));
  });

  it('revokes a key', async () => {
    mockList.mockResolvedValueOnce([{ id: 1, name: 'K', active: true }]).mockResolvedValueOnce([{ id: 1, name: 'K', active: false }]);
    mockRevoke.mockResolvedValue({ id: 1, active: false });
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByText('Revoke'));
    fireEvent.click(screen.getByText('Revoke'));
    await waitFor(() => expect(mockRevoke).toHaveBeenCalledWith(1));
  });

  it('handles revoke error', async () => {
    mockList.mockResolvedValue([{ id: 1, name: 'K', active: true }]);
    mockRevoke.mockRejectedValue(new Error('revoke fail'));
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByText('Revoke'));
    fireEvent.click(screen.getByText('Revoke'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('revoke fail'));
  });

  it('removes a key', async () => {
    mockList.mockResolvedValueOnce([{ id: 1, name: 'K', active: false }]).mockResolvedValueOnce([]);
    mockRemove.mockResolvedValue({ deleted: true });
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(1));
  });

  it('handles remove error', async () => {
    mockList.mockResolvedValue([{ id: 1, name: 'K', active: false }]);
    mockRemove.mockRejectedValue(new Error('delete fail'));
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('delete fail'));
  });

  it('dismisses new key banner', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 1, name: 'N', key: 'ak_x' }); // pragma: allowlist secret
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByPlaceholderText('Key name'));
    fireEvent.change(screen.getByPlaceholderText('Key name'), { target: { value: 'N' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => screen.getByText('Dismiss'));
    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByTestId('new-key')).not.toBeInTheDocument();
  });

  it('navigates back to profile', async () => {
    mockList.mockResolvedValue([]);
    render(<ApiKeysPage />);
    await waitFor(() => screen.getByText(/Back to Profile/));
    fireEvent.click(screen.getByText(/Back to Profile/));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/profile');
  });
});
