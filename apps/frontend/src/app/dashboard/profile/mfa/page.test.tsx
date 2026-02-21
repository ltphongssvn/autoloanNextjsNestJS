import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import MfaPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('../../../../services/api', () => ({
  api: { mfa: { status: vi.fn(), setup: vi.fn(), enable: vi.fn(), disable: vi.fn() } },
}));

import { api } from '../../../../services/api';
const mockStatus = vi.mocked(api.mfa.status);
const mockSetup = vi.mocked(api.mfa.setup);
const mockEnable = vi.mocked(api.mfa.enable);
const mockDisable = vi.mocked(api.mfa.disable);

describe('MfaPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows loading then status disabled', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    render(<MfaPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('mfa-status')).toHaveTextContent('Disabled'));
    expect(screen.getByText('Enable MFA')).toBeInTheDocument();
  });

  it('shows status enabled with disable button', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: true });
    render(<MfaPage />);
    await waitFor(() => expect(screen.getByTestId('mfa-status')).toHaveTextContent('Enabled'));
    expect(screen.getByText('Disable MFA')).toBeInTheDocument();
  });

  it('shows error on status fetch failure', async () => {
    mockStatus.mockRejectedValue(new Error('fetch fail'));
    render(<MfaPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('fetch fail'));
  });

  it('handles setup flow', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ secret: 'abc123', otp_auth_url: 'otpauth://totp/AutoLoan:a@b.com?secret=abc123' }); // pragma: allowlist secret
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Enable MFA'));
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByTestId('mfa-secret')).toHaveTextContent('abc123'));
  });

  it('handles setup error', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockRejectedValue(new Error('setup fail'));
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Enable MFA'));
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('setup fail'));
  });

  it('handles enable with code and shows backup codes', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ secret: 's', otp_auth_url: 'url' }); // pragma: allowlist secret
    mockEnable.mockResolvedValue({ mfa_enabled: true, backup_codes: ['c1', 'c2'] });
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Enable MFA'));
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => screen.getByLabelText('Verification Code'));
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify & Enable'));
    await waitFor(() => expect(screen.getByTestId('backup-codes')).toBeInTheDocument());
    expect(screen.getByText('c1')).toBeInTheDocument();
    expect(screen.getByText('c2')).toBeInTheDocument();
  });

  it('handles enable error', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ secret: 's', otp_auth_url: 'url' }); // pragma: allowlist secret
    mockEnable.mockRejectedValue(new Error('bad code'));
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Enable MFA'));
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => screen.getByLabelText('Verification Code'));
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByText('Verify & Enable'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('bad code'));
  });

  it('handles disable flow', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: true });
    mockDisable.mockResolvedValue({ mfa_enabled: false });
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Disable MFA'));
    fireEvent.click(screen.getByText('Disable MFA'));
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Disable MFA/ }));
    await waitFor(() => expect(screen.getByTestId('mfa-status')).toHaveTextContent('Disabled'));
  });

  it('handles disable error', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: true });
    mockDisable.mockRejectedValue(new Error('wrong code'));
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Disable MFA'));
    fireEvent.click(screen.getByText('Disable MFA'));
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /Disable MFA/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('wrong code'));
  });

  it('cancel from setup returns to status', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ secret: 's', otp_auth_url: 'url' }); // pragma: allowlist secret
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Enable MFA'));
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByTestId('mfa-status')).toBeInTheDocument();
  });

  it('done from confirm returns to status', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ secret: 's', otp_auth_url: 'url' }); // pragma: allowlist secret
    mockEnable.mockResolvedValue({ mfa_enabled: true, backup_codes: ['x'] });
    render(<MfaPage />);
    await waitFor(() => screen.getByText('Enable MFA'));
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => screen.getByLabelText('Verification Code'));
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify & Enable'));
    await waitFor(() => screen.getByText('Done'));
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByTestId('mfa-status')).toBeInTheDocument();
  });

  it('navigates back to profile', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    render(<MfaPage />);
    await waitFor(() => screen.getByText(/Back to Profile/));
    fireEvent.click(screen.getByText(/Back to Profile/));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/profile');
  });
});
