'use client';
import { useState, useCallback } from 'react';

export default function PaymentCalculator() {
  const [loanAmount, setLoanAmount] = useState(25000);
  const [downPayment, setDownPayment] = useState(5000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(60);

  const calculateMonthlyPayment = useCallback(() => {
    const principal = loanAmount - downPayment;
    if (principal <= 0) return 0;
    const monthlyRate = interestRate / 100 / 12;
    if (monthlyRate === 0) return principal / loanTerm;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / (Math.pow(1 + monthlyRate, loanTerm) - 1);
  }, [loanAmount, downPayment, interestRate, loanTerm]);

  const monthly = calculateMonthlyPayment();
  const totalCost = monthly * loanTerm;
  const totalInterest = totalCost - (loanAmount - downPayment);

  return (
    <section data-testid="payment-calculator" className="mb-16 p-8 bg-white rounded-xl shadow-sm border">
      <h2 className="text-2xl font-bold text-center mb-8">Payment Calculator</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="loan-amount" className="flex justify-between text-sm font-medium mb-2">
              <span>Loan Amount</span><span data-testid="loan-amount-value">${loanAmount.toLocaleString()}</span>
            </label>
            <input id="loan-amount" data-testid="loan-amount-slider" type="range" min="5000" max="100000" step="1000"
              value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
          <div>
            <label htmlFor="down-payment" className="flex justify-between text-sm font-medium mb-2">
              <span>Down Payment</span><span data-testid="down-payment-value">${downPayment.toLocaleString()}</span>
            </label>
            <input id="down-payment" data-testid="down-payment-slider" type="range" min="0" max="50000" step="500"
              value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
          <div>
            <label htmlFor="interest-rate" className="flex justify-between text-sm font-medium mb-2">
              <span>Interest Rate</span><span data-testid="interest-rate-value">{interestRate.toFixed(1)}%</span>
            </label>
            <input id="interest-rate" data-testid="interest-rate-slider" type="range" min="0" max="20" step="0.1"
              value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
          <div>
            <label htmlFor="loan-term" className="flex justify-between text-sm font-medium mb-2">
              <span>Loan Term</span><span data-testid="loan-term-value">{loanTerm} months</span>
            </label>
            <input id="loan-term" data-testid="loan-term-slider" type="range" min="12" max="84" step="12"
              value={loanTerm} onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
        </div>
        <div className="flex flex-col justify-center items-center bg-blue-50 rounded-xl p-8">
          <p className="text-sm text-gray-500 mb-1">Estimated Monthly Payment</p>
          <p data-testid="monthly-payment" className="text-4xl font-bold text-blue-600 mb-6">
            ${monthly.toFixed(2)}
          </p>
          <div className="w-full space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Loan Amount</span><span data-testid="summary-principal">${(loanAmount - downPayment).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Interest</span><span data-testid="summary-interest">${totalInterest > 0 ? totalInterest.toFixed(2) : '0.00'}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-medium">Total Cost</span><span data-testid="summary-total" className="font-medium">${totalCost > 0 ? totalCost.toFixed(2) : '0.00'}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
