'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../services/api';

export default function MfaPage() {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'status' | 'setup' | 'confirm' | 'disable'>('status');
  const [secret, setSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.mfa.status()
      .then((res) => { setMfaEnabled(res.mfa_enabled); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const handleSetup = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.mfa.setup();
      setSecret(res.secret);
      setOtpAuthUrl(res.otp_auth_url);
      setStep('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!code) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await api.mfa.enable(code);
      setBackupCodes(res.backup_codes || []);
      setMfaEnabled(true);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!code) return;
    setActionLoading(true);
    setError('');
    try {
      await api.mfa.disable(code);
      setMfaEnabled(false);
      setStep('status');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/dashboard/profile')} className="text-blue-600 hover:underline text-sm mb-4 block">&larr; Back to Profile</button>
      <h1 className="text-2xl font-bold mb-6">Two-Factor Authentication</h1>
      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {step === 'status' && (
        <div className="bg-white rounded-xl border p-6">
          <p className="mb-4">Status: <span data-testid="mfa-status" className={mfaEnabled ? 'text-green-600 font-medium' : 'text-gray-500'}>{mfaEnabled ? 'Enabled' : 'Disabled'}</span></p>
          {mfaEnabled ? (
            <button onClick={() => { setStep('disable'); setCode(''); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Disable MFA</button>
          ) : (
            <button onClick={handleSetup} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">{actionLoading ? 'Setting up...' : 'Enable MFA'}</button>
          )}
        </div>
      )}

      {step === 'setup' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Scan QR Code</h2>
          <p className="text-sm text-gray-600">Use your authenticator app to scan this code, or enter the secret manually:</p>
          <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm break-all" data-testid="mfa-secret">{secret}</div>
          <p className="text-xs text-gray-400 break-all">{otpAuthUrl}</p>
          <div>
            <label htmlFor="mfa-code" className="block text-sm font-medium mb-1">Verification Code</label>
            <input id="mfa-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code" maxLength={6} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleEnable} disabled={actionLoading || !code} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">{actionLoading ? 'Verifying...' : 'Verify & Enable'}</button>
            <button onClick={() => setStep('status')} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-green-600">MFA Enabled Successfully</h2>
          <p className="text-sm text-gray-600">Save these backup codes in a safe place. Each can be used once if you lose access to your authenticator:</p>
          <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-2" data-testid="backup-codes">
            {backupCodes.map((c) => <code key={c} className="font-mono text-sm">{c}</code>)}
          </div>
          <button onClick={() => setStep('status')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Done</button>
        </div>
      )}

      {step === 'disable' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Disable MFA</h2>
          <p className="text-sm text-gray-600">Enter your verification code or a backup code to disable MFA:</p>
          <div>
            <label htmlFor="disable-code" className="block text-sm font-medium mb-1">Code</label>
            <input id="disable-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleDisable} disabled={actionLoading || !code} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">{actionLoading ? 'Disabling...' : 'Disable MFA'}</button>
            <button onClick={() => setStep('status')} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}
