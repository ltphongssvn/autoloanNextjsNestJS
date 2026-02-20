// apps/frontend/src/app/dashboard/applications/new/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../services/api';

export default function NewApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    loanAmount: '',
    downPayment: '',
    loanTerm: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        loanAmount: Number(formData.loanAmount),
        downPayment: Number(formData.downPayment),
        loanTerm: Number(formData.loanTerm),
      };
      const res = await api.applications.create(payload);
      router.push(`/dashboard/applications/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h1>New Loan Application</h1>
      {error && <div role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="loanAmount">Loan Amount ($)</label>
        <input id="loanAmount" name="loanAmount" type="number" min="0" value={formData.loanAmount} onChange={handleChange} required />
        <label htmlFor="downPayment">Down Payment ($)</label>
        <input id="downPayment" name="downPayment" type="number" min="0" value={formData.downPayment} onChange={handleChange} required />
        <label htmlFor="loanTerm">Loan Term (months)</label>
        <select id="loanTerm" name="loanTerm" value={formData.loanTerm} onChange={handleChange} required>
          <option value="">Select term</option>
          <option value="24">24 months</option>
          <option value="36">36 months</option>
          <option value="48">48 months</option>
          <option value="60">60 months</option>
          <option value="72">72 months</option>
        </select>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Application'}</button>
      </form>
    </main>
  );
}
