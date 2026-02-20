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

  return (
    <main>
      <h1>New Loan Application</h1>
      <p data-testid="step-indicator">Step {step} of 4</p>
      {error && <div role="alert">{error}</div>}

      {step === 1 && (
        <section data-testid="step-personal">
          <h2>Personal Information</h2>
          <label>Date of Birth<input type="date" value={form.dob} onChange={update('dob')} /></label>
          <label>Street Address<input value={form.streetAddress} onChange={update('streetAddress')} /></label>
          <label>City<input value={form.city} onChange={update('city')} /></label>
          <label>State<input value={form.state} onChange={update('state')} /></label>
          <label>ZIP Code<input value={form.zipCode} onChange={update('zipCode')} /></label>
          <button onClick={next}>Next</button>
        </section>
      )}

      {step === 2 && (
        <section data-testid="step-vehicle">
          <h2>Vehicle Information</h2>
          <label>Make<input value={form.make} onChange={update('make')} /></label>
          <label>Model<input value={form.model} onChange={update('model')} /></label>
          <label>Year<input value={form.year} onChange={update('year')} /></label>
          <label>VIN<input value={form.vin} onChange={update('vin')} /></label>
          <label>Estimated Value<input type="number" value={form.estimatedValue} onChange={update('estimatedValue')} /></label>
          <button onClick={back}>Back</button>
          <button onClick={next}>Next</button>
        </section>
      )}

      {step === 3 && (
        <section data-testid="step-employment">
          <h2>Employment & Income</h2>
          <label>Employer Name<input value={form.employerName} onChange={update('employerName')} /></label>
          <label>Job Title<input value={form.jobTitle} onChange={update('jobTitle')} /></label>
          <label>Annual Income<input type="number" value={form.annualIncome} onChange={update('annualIncome')} /></label>
          <label>Monthly Expenses<input type="number" value={form.monthlyExpenses} onChange={update('monthlyExpenses')} /></label>
          <button onClick={back}>Back</button>
          <button onClick={next}>Next</button>
        </section>
      )}

      {step === 4 && (
        <section data-testid="step-loan">
          <h2>Loan Details</h2>
          <label>Loan Amount<input type="number" value={form.loanAmount} onChange={update('loanAmount')} /></label>
          <label>Down Payment<input type="number" value={form.downPayment} onChange={update('downPayment')} /></label>
          <label>Loan Term (months)
            <select value={form.loanTerm} onChange={update('loanTerm')}>
              <option value="36">36</option>
              <option value="48">48</option>
              <option value="60">60</option>
              <option value="72">72</option>
            </select>
          </label>
          <button onClick={back}>Back</button>
          <button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </section>
      )}
    </main>
  );
}
