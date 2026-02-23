'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../services/api';

const LOAN_TERMS = [
  { months: 36, apr: 6.5 },
  { months: 48, apr: 6.9 },
  { months: 60, apr: 7.2 },
];
const VEHICLE_MAKES = ['Toyota','Honda','Ford','Chevrolet','BMW','Mercedes','Nissan','Hyundai','Kia','Volkswagen'];
const VEHICLE_MODELS = ['Camry','Corolla','Accord','Civic','F-150','Model 3'];
const VEHICLE_YEARS = Array.from({ length: 10 }, (_, i) => (2025 - i).toString());
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

interface PersonalInfo { first_name: string; last_name: string; dob: string; ssn: string; address: string; city: string; state: string; zip: string; years_at_address: string; months_at_address: string; phone: string; email: string; }
interface CarDetails { make: string; model: string; trim: string; year: string; mileage: string; vin: string; condition: string; price: string; }
interface LoanDetails { amount: string; down_payment: string; }
interface EmploymentInfo { employer: string; job_title: string; employment_status: string; years: string; months_employed: string; income: string; expenses: string; other_income: string; credit_score: string; }

const emptyPersonal: PersonalInfo = { first_name: '', last_name: '', dob: '', ssn: '', address: '', city: '', state: '', zip: '', years_at_address: '', months_at_address: '', phone: '', email: '' };
const emptyCar: CarDetails = { make: '', model: '', trim: '', year: '', mileage: '', vin: '', condition: '', price: '' };
const emptyLoan: LoanDetails = { amount: '', down_payment: '' };
const emptyEmployment: EmploymentInfo = { employer: '', job_title: '', employment_status: '', years: '', months_employed: '', income: '', expenses: '', other_income: '', credit_score: '' };

const inputClass = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
const selectClass = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white';
const labelClass = 'block text-sm font-medium mb-1';

function calculatePayment(principal: number, term: number, apr: number) {
  if (principal <= 0) return 0;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
}

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [personal, setPersonal] = useState<PersonalInfo>(emptyPersonal);
  const [car, setCar] = useState<CarDetails>(emptyCar);
  const [loan, setLoan] = useState<LoanDetails>(emptyLoan);
  const [employment, setEmployment] = useState<EmploymentInfo>(emptyEmployment);
  const [selectedTerm, setSelectedTerm] = useState(48);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [documents, setDocuments] = useState({ drivers_license: false, proof_income: false, proof_residence: false });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vehicleValue = Number(car.price || 0);
  const loanAmount = Number(loan.amount || 0);
  const downPayment = Number(loan.down_payment || 0);
  const principal = loanAmount - downPayment;
  const ltv = vehicleValue > 0 ? Math.round((principal / vehicleValue) * 100) : 0;
  const totalIncome = Number(employment.income || 0) + Number(employment.other_income || 0);
  const termData = LOAN_TERMS.find((t) => t.months === selectedTerm) || LOAN_TERMS[1];
  const monthlyPayment = calculatePayment(principal, selectedTerm, termData.apr);
  const dti = totalIncome > 0 ? Math.round((monthlyPayment / totalIncome) * 100) : 0;

  const updateField = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, field: keyof T) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setter((prev) => ({ ...prev, [field]: e.target.value } as T));

  const next = () => { setError(''); setStep((s) => Math.min(s + 1, 5)); };
  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    if (!termsAccepted) { setError('Please accept the terms and conditions.'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.applications.create({
        loanAmount: principal,
        downPayment,
        loanTerm: selectedTerm,
      });
      router.push(`/dashboard/applications/${res.data?.id ?? res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Personal Info', 'Car Details', 'Loan Details', 'Employment', 'Review'];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">New Loan Application</h1>
      <div className="flex gap-1 mb-6">
        {steps.map((s, i) => (
          <div key={s} className={`flex-1 text-center text-xs py-2 rounded-full font-medium ${i + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
        ))}
      </div>
      <p data-testid="step-indicator" className="text-sm text-gray-500 mb-4">Step {step} of 5</p>
      {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border p-6">
        {step === 1 && (
          <section data-testid="step-personal" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>First Name<input value={personal.first_name} onChange={updateField(setPersonal, 'first_name')} className={inputClass} /></label>
              <label className={labelClass}>Last Name<input value={personal.last_name} onChange={updateField(setPersonal, 'last_name')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Date of Birth<input type="date" value={personal.dob} onChange={updateField(setPersonal, 'dob')} className={inputClass} /></label>
              <label className={labelClass}>SSN<input type="password" placeholder="XXX-XX-XXXX" value={personal.ssn} onChange={updateField(setPersonal, 'ssn')} className={inputClass} /></label>
            </div>
            <label className={labelClass}>Street Address<input value={personal.address} onChange={updateField(setPersonal, 'address')} className={inputClass} /></label>
            <div className="grid grid-cols-3 gap-4">
              <label className={labelClass}>City<input value={personal.city} onChange={updateField(setPersonal, 'city')} className={inputClass} /></label>
              <label className={labelClass}>State
                <select value={personal.state} onChange={updateField(setPersonal, 'state')} className={selectClass}>
                  <option value="">Select</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className={labelClass}>ZIP<input value={personal.zip} onChange={updateField(setPersonal, 'zip')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Years at Address<input type="number" value={personal.years_at_address} onChange={updateField(setPersonal, 'years_at_address')} className={inputClass} /></label>
              <label className={labelClass}>Months<input type="number" value={personal.months_at_address} onChange={updateField(setPersonal, 'months_at_address')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Phone<input value={personal.phone} onChange={updateField(setPersonal, 'phone')} className={inputClass} /></label>
              <label className={labelClass}>Email<input type="email" value={personal.email} onChange={updateField(setPersonal, 'email')} className={inputClass} /></label>
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
              <label className={labelClass}>Make
                <select value={car.make} onChange={updateField(setCar, 'make')} className={selectClass}>
                  <option value="">Select</option>
                  {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label className={labelClass}>Model
                <select value={car.model} onChange={updateField(setCar, 'model')} className={selectClass}>
                  <option value="">Select</option>
                  {VEHICLE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Trim Level<input placeholder="e.g., SE, XLE" value={car.trim} onChange={updateField(setCar, 'trim')} className={inputClass} /></label>
              <label className={labelClass}>Year
                <select value={car.year} onChange={updateField(setCar, 'year')} className={selectClass}>
                  <option value="">Select</option>
                  {VEHICLE_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Mileage<input type="number" value={car.mileage} onChange={updateField(setCar, 'mileage')} className={inputClass} /></label>
              <label className={labelClass}>VIN<input placeholder="17-character VIN" value={car.vin} onChange={updateField(setCar, 'vin')} className={inputClass} /></label>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Condition</p>
              <div className="flex gap-4" data-testid="condition-radio">
                {[['new','New'],['used_certified','Certified Used'],['used','Used']].map(([val, lbl]) => (
                  <label key={val} className="flex items-center gap-1 text-sm">
                    <input type="radio" name="condition" value={val} checked={car.condition === val} onChange={updateField(setCar, 'condition')} />{lbl}
                  </label>
                ))}
              </div>
            </div>
            <label className={labelClass}>Vehicle Value ($)<input type="number" value={car.price} onChange={updateField(setCar, 'price')} className={inputClass} /></label>
            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
              <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Next</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section data-testid="step-loan" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Loan Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Loan Amount ($)<input type="number" value={loan.amount} onChange={updateField(setLoan, 'amount')} className={inputClass} /></label>
              <label className={labelClass}>Down Payment ($)<input type="number" value={loan.down_payment} onChange={updateField(setLoan, 'down_payment')} className={inputClass} /></label>
            </div>
            <div data-testid="loan-summary" className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Loan Summary</h3>
              <div className="flex justify-between py-1"><span>Vehicle Value:</span><span className="font-medium">${vehicleValue.toLocaleString()}</span></div>
              <div className="flex justify-between py-1"><span>Down Payment:</span><span className="font-medium">${downPayment.toLocaleString()}</span></div>
              <hr className="my-2" />
              <div className="flex justify-between py-1"><span>Loan Amount:</span><span className="font-semibold">${principal.toLocaleString()}</span></div>
              <div className="flex justify-between py-1"><span>Loan-to-Value:</span><span data-testid="ltv-value" className={`font-medium ${ltv > 100 ? 'text-red-600' : 'text-green-600'}`}>{ltv}%</span></div>
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
              <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Next</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section data-testid="step-employment" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Employment & Financial Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Employer<input value={employment.employer} onChange={updateField(setEmployment, 'employer')} className={inputClass} /></label>
              <label className={labelClass}>Job Title<input value={employment.job_title} onChange={updateField(setEmployment, 'job_title')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <label className={labelClass}>Employment Status
                <select value={employment.employment_status} onChange={updateField(setEmployment, 'employment_status')} className={selectClass}>
                  <option value="">Select</option>
                  <option value="full_time">Full-Time</option>
                  <option value="part_time">Part-Time</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
              <label className={labelClass}>Years at Job<input type="number" value={employment.years} onChange={updateField(setEmployment, 'years')} className={inputClass} /></label>
              <label className={labelClass}>Months<input type="number" value={employment.months_employed} onChange={updateField(setEmployment, 'months_employed')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Annual Income ($)<input type="number" value={employment.income} onChange={updateField(setEmployment, 'income')} className={inputClass} /></label>
              <label className={labelClass}>Monthly Expenses ($)<input type="number" value={employment.expenses} onChange={updateField(setEmployment, 'expenses')} className={inputClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Other Income ($)<input type="number" value={employment.other_income} onChange={updateField(setEmployment, 'other_income')} className={inputClass} /></label>
              <label className={labelClass}>Credit Score<input type="number" placeholder="300-850" value={employment.credit_score} onChange={updateField(setEmployment, 'credit_score')} className={inputClass} /></label>
            </div>
            <div data-testid="dti-alert" className={`p-3 rounded-lg text-sm ${dti < 43 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              Debt-to-Income Ratio: {dti}% {dti < 43 ? '(Good)' : '(High)'}
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
              <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Next</button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section data-testid="step-review" className="space-y-4">
            <h2 className="text-lg font-semibold mb-2">Select Terms & Review</h2>
            <div className="grid grid-cols-3 gap-3 mb-4" data-testid="term-cards">
              {LOAN_TERMS.map((term) => {
                const payment = calculatePayment(principal, term.months, term.apr);
                return (
                  <button key={term.months} data-testid={`term-${term.months}`} onClick={() => setSelectedTerm(term.months)}
                    className={`p-4 rounded-lg text-center cursor-pointer border-2 transition ${selectedTerm === term.months ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-semibold">{term.months} months</p>
                    <p className="text-2xl font-bold text-blue-600">${payment.toFixed(0)}</p>
                    <p className="text-sm text-gray-500">{term.apr}% APR</p>
                  </button>
                );
              })}
            </div>
            <div data-testid="review-summary" className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Application Summary</h3>
              <div className="flex justify-between items-center py-2 border-b">
                <span><strong>Personal:</strong> {personal.first_name} {personal.last_name}</span>
                <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">Edit</button>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span><strong>Vehicle:</strong> {car.year} {car.make} {car.model}</span>
                <button onClick={() => setStep(2)} className="text-sm text-blue-600 hover:underline">Edit</button>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span><strong>Loan:</strong> ${principal.toLocaleString()} @ {termData.apr}% for {selectedTerm} mo</span>
                <button onClick={() => setStep(3)} className="text-sm text-blue-600 hover:underline">Edit</button>
              </div>
              <div className="mt-3 p-3 bg-blue-600 text-white rounded-lg text-center">
                <p data-testid="review-monthly-payment" className="text-xl font-bold">${monthlyPayment.toFixed(2)}/month</p>
              </div>
            </div>
            <div data-testid="document-checklist">
              <p className="text-sm font-medium mb-2">Required Documents:</p>
              <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={documents.drivers_license} onChange={(e) => setDocuments((d) => ({ ...d, drivers_license: e.target.checked }))} />Driver&apos;s License</label>
              <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={documents.proof_income} onChange={(e) => setDocuments((d) => ({ ...d, proof_income: e.target.checked }))} />Proof of Income</label>
              <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={documents.proof_residence} onChange={(e) => setDocuments((d) => ({ ...d, proof_residence: e.target.checked }))} />Proof of Residence</label>
            </div>
            <div data-testid="terms-acceptance" className="p-3 bg-blue-50 rounded-lg">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />I agree to the Terms and Conditions</label>
            </div>
            <div className="flex justify-between">
              <button onClick={back} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition">
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
