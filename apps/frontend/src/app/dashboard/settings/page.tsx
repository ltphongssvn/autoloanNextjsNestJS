'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export default function SettingsPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.mfa.status();
        setMfaEnabled(res.mfa_enabled ?? res.data?.mfa_enabled ?? false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load MFA status');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSetup = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.mfa.setup();
      setQrCode(res.qr_code ?? res.data?.qr_code ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup MFA');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!code.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await api.mfa.enable(code);
      setMfaEnabled(true);
      setQrCode('');
      setCode('');
      setMessage('Two-factor authentication enabled successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!code.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await api.mfa.disable(code);
      setMfaEnabled(false);
      setCode('');
      setMessage('Two-factor authentication disabled.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      <section data-testid="security-section" className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Security Settings</h2>

        {message && <div role="status" className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
        {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div data-testid="mfa-settings">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">{mfaEnabled ? 'Enabled — your account has extra protection.' : 'Add an extra layer of security to your account.'}</p>
              </div>
              <span data-testid="mfa-status" className={`text-xs font-medium px-3 py-1 rounded-full ${mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {!mfaEnabled && !qrCode && (
              <button onClick={handleSetup} disabled={actionLoading} data-testid="setup-btn"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                {actionLoading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
              </button>
            )}

            {qrCode && (
              <div data-testid="qr-section" className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm mb-3">Scan this QR code with your authenticator app:</p>
                <Image src={qrCode} alt="MFA QR Code" width={200} height={200} className="mb-4 mx-auto" />
                <div className="flex gap-2">
                  <input type="text" aria-label="Verification code" value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={handleEnable} disabled={actionLoading || !code.trim()} data-testid="enable-btn"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
                    {actionLoading ? 'Verifying...' : 'Enable'}
                  </button>
                </div>
              </div>
            )}

            {mfaEnabled && (
              <div data-testid="disable-section" className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 mb-3">Enter your authenticator code to disable MFA:</p>
                <div className="flex gap-2">
                  <input type="text" aria-label="Disable code" value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={handleDisable} disabled={actionLoading || !code.trim()} data-testid="disable-btn"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
                    {actionLoading ? 'Disabling...' : 'Disable MFA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
