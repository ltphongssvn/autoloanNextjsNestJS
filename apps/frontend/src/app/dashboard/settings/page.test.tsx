import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SettingsPage from './page';

const mockStatus = vi.fn();
const mockSetup = vi.fn();
const mockEnable = vi.fn();
const mockDisable = vi.fn();
vi.mock('../../../services/api', () => ({
  api: { mfa: {
    status: (...a: unknown[]) => mockStatus(...a),
    setup: (...a: unknown[]) => mockSetup(...a),
    enable: (...a: unknown[]) => mockEnable(...a),
    disable: (...a: unknown[]) => mockDisable(...a),
  }},
}));

describe('SettingsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders loading then MFA disabled state', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByTestId('mfa-settings')).toBeInTheDocument());
    expect(screen.getByTestId('mfa-status')).toHaveTextContent('Disabled');
    expect(screen.getByTestId('setup-btn')).toBeInTheDocument();
  });

  it('renders MFA enabled state', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: true });
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByTestId('mfa-status')).toHaveTextContent('Enabled'));
    expect(screen.getByTestId('disable-section')).toBeInTheDocument();
  });

  it('shows QR code after setup', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ qr_code: 'data:image/png;base64,test' });
    render(<SettingsPage />);
    await waitFor(() => fireEvent.click(screen.getByTestId('setup-btn')));
    await waitFor(() => expect(screen.getByTestId('qr-section')).toBeInTheDocument());
  });

  it('enables MFA with code', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ qr_code: 'data:image/png;base64,test' });
    mockEnable.mockResolvedValue({});
    render(<SettingsPage />);
    await waitFor(() => fireEvent.click(screen.getByTestId('setup-btn')));
    await waitFor(() => expect(screen.getByTestId('qr-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByTestId('enable-btn'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('enabled successfully'));
  });

  it('disables MFA with code', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: true });
    mockDisable.mockResolvedValue({});
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByTestId('disable-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Disable code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByTestId('disable-btn'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('disabled'));
  });

  it('handles status load error', async () => {
    mockStatus.mockRejectedValue(new Error('Network'));
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network'));
  });

  it('handles setup error', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockRejectedValue(new Error('Setup failed'));
    render(<SettingsPage />);
    await waitFor(() => fireEvent.click(screen.getByTestId('setup-btn')));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Setup failed'));
  });

  it('handles enable error', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ qr_code: 'data:test' });
    mockEnable.mockRejectedValue(new Error('Bad code'));
    render(<SettingsPage />);
    await waitFor(() => fireEvent.click(screen.getByTestId('setup-btn')));
    await waitFor(() => expect(screen.getByTestId('qr-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByTestId('enable-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Bad code'));
  });

  it('handles disable error', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: true });
    mockDisable.mockRejectedValue(new Error('Wrong code'));
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByTestId('disable-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Disable code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByTestId('disable-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Wrong code'));
  });

  it('renders back link and heading', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByText('Account Settings')).toBeInTheDocument());
    expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
  });

  it('handles wrapped status response', async () => {
    mockStatus.mockResolvedValue({ data: { mfa_enabled: true } });
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByTestId('mfa-status')).toHaveTextContent('Enabled'));
  });

  it('handles non-Error failures', async () => {
    mockStatus.mockRejectedValue('fail');
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load'));
  });

  it('handles non-Error setup failure', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockRejectedValue('fail');
    render(<SettingsPage />);
    await waitFor(() => fireEvent.click(screen.getByTestId('setup-btn')));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to setup'));
  });

  it('handles non-Error enable failure', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ qr_code: 'data:image/png;base64,abc' });
    mockEnable.mockRejectedValue('fail');
    render(<SettingsPage />);
    await waitFor(() => fireEvent.click(screen.getByTestId('setup-btn')));
    await waitFor(() => expect(screen.getByTestId('qr-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '111111' } });
    fireEvent.click(screen.getByTestId('enable-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid code'));
  });

  it('handles non-Error disable failure', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: true });
    mockDisable.mockRejectedValue('fail');
    render(<SettingsPage />);
    await waitFor(() => expect(screen.getByTestId('disable-section')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Disable code'), { target: { value: '111111' } });
    fireEvent.click(screen.getByTestId('disable-btn'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid code'));
  });

  it('handles wrapped setup response', async () => {
    mockStatus.mockResolvedValue({ mfa_enabled: false });
    mockSetup.mockResolvedValue({ data: { qr_code: 'data:image/png;base64,wrapped' } });
    render(<SettingsPage />);
    await waitFor(() => fireEvent.click(screen.getByTestId('setup-btn')));
    await waitFor(() => expect(screen.getByTestId('qr-section')).toBeInTheDocument());
  });
});
