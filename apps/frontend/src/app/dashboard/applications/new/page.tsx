// apps/frontend/src/app/dashboard/applications/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../services/api';

interface FormData {
  loanAmount: string;
  downPayment: string;
  loanTerm: string;
  dob: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  estimatedValue: string;
  employerName: string;
  jobTitle: string;
  annualIncome: string;
  monthlyExpenses: string;
}

const initialForm: FormData = {
  loanAmount: '', downPayment: '', loanTerm: '60', dob: '',
  streetAddress: '', city: '', state: '', zipCode: '',
  make: '', model: '', year: '', vin: '', estimatedValue: '',
  employerName: '', jobTitle: '', annualIncome: '', monthlyExpenses: '',
};

const inputClass = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
const labelClass = 'block text-sm font-medium mb-1';

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const next = () => { setError(''); setStep((s) => s + 1); };
  const back = () => { setError(''); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.applications.create({
        loanAmount: Number(form.loanAmount),
        downPayment: Number(form.downPayment),
        loanTerm: Number(form.loanTerm),
      });
      router.push(`/dashboard/applications/${res.data?.id ?? res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Personal', 'Vehicle', 'Employment', 'Loan'];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">New Loan Application</h1>
      <div className="flex gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className={`flex-1 text-center text-xs py-1 rounded-full ${i + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
        ))}
      </div>
      <p data-testid="step-indicator" className="text-sm text-gray-500 mb-4">Step {step} of 4</p>
      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border p-6">
        {step === 1 && (
          <section data-testid="step-personal" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
            <div>
              <label className={labelClass}>Date of Birth<input type="date" value={form.dob} onChange={update('dob')} className={inputClass} /></label>
            </div>
            <div>
              <label className={labelClass}>Street Address<input value={form.streetAddress} onChange={update('streetAddress')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <label className={labelClass}>City<input value={form.city} onChange={update('city')} className={inputClass} /></label>
              <label className={labelClass}>State<input value={form.state} onChange={update('state')} className={inputClass} /></label>
              <label className={labelClass}>ZIP Code<input value={form.zipCode} onChange={update('zipCode')} className={inputClass} /></label>
            </div>
            <div className="flex justify-end">
              <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Next</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section data-testid="step-vehicle" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Vehicle Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Make<input value={form.make} onChange={update('make')} className={inputClass} /></label>
              <label className={labelClass}>Model<input value={form.model} onChange={update('model')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Year<input value={form.year} onChange={update('year')} className={inputClass} /></label>
              <label className={labelClass}>VIN<input value={form.vin} onChange={update('vin')} className={inputClass} /></label>
            </div>
            <div>
              <label className={labelClass}>Estimated Value<input type="number" value={form.estimatedValue} onChange={update('estimatedValue')} className={inputClass} /></label>
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
              <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Next</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section data-testid="step-employment" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Employment & Income</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Employer Name<input value={form.employerName} onChange={update('employerName')} className={inputClass} /></label>
              <label className={labelClass}>Job Title<input value={form.jobTitle} onChange={update('jobTitle')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Annual Income<input type="number" value={form.annualIncome} onChange={update('annualIncome')} className={inputClass} /></label>
              <label className={labelClass}>Monthly Expenses<input type="number" value={form.monthlyExpenses} onChange={update('monthlyExpenses')} className={inputClass} /></label>
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
              <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Next</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section data-testid="step-loan" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Loan Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Loan Amount<input type="number" value={form.loanAmount} onChange={update('loanAmount')} className={inputClass} /></label>
              <label className={labelClass}>Down Payment<input type="number" value={form.downPayment} onChange={update('downPayment')} className={inputClass} /></label>
            </div>
            <div>
              <label className={labelClass}>Loan Term (months)
                <select value={form.loanTerm} onChange={update('loanTerm')} className={inputClass}>
                  <option value="36">36</option>
                  <option value="48">48</option>
                  <option value="60">60</option>
                  <option value="72">72</option>
                </select>
              </label>
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
