'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../../services/api';
import type { Application } from '@autoloan/shared-types';

export default function LoanAgreementPage() {
  const { id } = useParams<{ id: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [authorizeSignature, setAuthorizeSignature] = useState(false);
  const [signature, setSignature] = useState('');
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.applications.get(Number(id));
        const app = res.data ?? res;
        setApplication(app);
        if ((app as unknown as Record<string, unknown>).signed_at) setSigned(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.stroke();
    setSignature('drawn');
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const handleSign = async () => {
    if (!agreedTerms || !authorizeSignature || !signature) return;
    setSigning(true);
    try {
      const res = await api.applications.sign(Number(id), signature);
      setApplication(res.data ?? res);
      setSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await api.applications.agreementPdf(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loan_agreement_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <div role="status" className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !application) return <div role="alert" className="p-8 text-center text-red-600">{error}</div>;
  if (!application) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  const app = application as unknown as Record<string, unknown>;
  const personal = (app.personal_info as Record<string, string>) || {};
  const car = (app.car_details as Record<string, string>) || {};
  const loanAmount = Number(application.loan_amount || 0);
  const downPayment = Number(application.down_payment || 0);
  const financed = loanAmount - downPayment;
  const term = application.loan_term || 48;
  const rate = Number(app.interest_rate || 6.9);
  const monthly = Number(app.monthly_payment || 0);
  const canSign = agreedTerms && authorizeSignature && !!signature && !signing;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/applications/${id}`} className="text-sm text-blue-600 hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold">Sign Documents</h1>
      </div>

      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {!signed ? (
        <>
          <div data-testid="congrats-banner" className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-lg font-semibold text-green-800">Congratulations!</p>
            <p className="text-sm text-green-700">Your loan application has been approved. Please review and sign below.</p>
          </div>

          <section data-testid="agreement-section" className="bg-white rounded-xl border p-6 mb-4">
            <h2 className="text-lg font-semibold mb-3">Loan Agreement</h2>
            <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-auto text-sm space-y-1">
              <p className="text-center font-bold mb-3">AUTO LOAN AGREEMENT</p>
              <hr className="my-2" />
              <p><strong>Borrower:</strong> {personal.first_name} {personal.last_name}</p>
              <p><strong>Loan Amount:</strong> ${financed.toLocaleString()}</p>
              <p><strong>Interest Rate:</strong> {rate}% APR</p>
              <p><strong>Term:</strong> {term} months</p>
              <p><strong>Monthly Payment:</strong> ${monthly.toFixed(2)}</p>
              <hr className="my-2" />
              <p><strong>Vehicle:</strong> {car.year} {car.make} {car.model}</p>
              <p><strong>VIN:</strong> {car.vin || 'N/A'}</p>
            </div>
            <button onClick={handleDownload} disabled={downloading} className="mt-3 text-sm text-blue-600 hover:underline disabled:opacity-50">
              {downloading ? 'Downloading...' : '⬇ Download PDF'}
            </button>
          </section>

          <section data-testid="signature-section" className="bg-white rounded-xl border p-6 mb-4">
            <h2 className="text-lg font-semibold mb-3">Sign Below</h2>
            <div className="border rounded-lg p-2 bg-white mb-2">
              <canvas ref={canvasRef} width={400} height={100}
                className="block w-full max-w-[400px] cursor-crosshair"
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
            </div>
            <button onClick={clearSignature} className="text-sm text-gray-500 hover:underline mb-3">Clear Signature</button>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} />
                I have read and agree to the loan terms
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={authorizeSignature} onChange={(e) => setAuthorizeSignature(e.target.checked)} />
                I authorize electronic signature
              </label>
            </div>
            <button onClick={handleSign} disabled={!canSign} data-testid="sign-btn"
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition">
              {signing ? 'Signing...' : 'Sign & Submit'}
            </button>
          </section>
        </>
      ) : (
        <section data-testid="signed-section" className="bg-white rounded-xl border p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">Agreement Signed & Submitted</h2>
          <p className="text-gray-500 mb-6">Documents will be sent to your email.</p>
          <div className="flex justify-center gap-3">
            <button onClick={handleDownload} disabled={downloading} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Back to Dashboard</Link>
          </div>
        </section>
      )}
    </main>
  );
}
