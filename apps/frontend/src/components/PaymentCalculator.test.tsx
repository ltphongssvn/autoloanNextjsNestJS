import { render, screen, fireEvent } from '@testing-library/react';
import PaymentCalculator from './PaymentCalculator';

describe('PaymentCalculator', () => {
  it('renders calculator section', () => {
    render(<PaymentCalculator />);
    expect(screen.getByTestId('payment-calculator')).toBeInTheDocument();
    expect(screen.getByText('Payment Calculator')).toBeInTheDocument();
  });

  it('shows default values', () => {
    render(<PaymentCalculator />);
    expect(screen.getByTestId('loan-amount-value')).toHaveTextContent('$25,000');
    expect(screen.getByTestId('down-payment-value')).toHaveTextContent('$5,000');
    expect(screen.getByTestId('interest-rate-value')).toHaveTextContent('6.5%');
    expect(screen.getByTestId('loan-term-value')).toHaveTextContent('60 months');
  });

  it('calculates monthly payment correctly', () => {
    render(<PaymentCalculator />);
    const payment = screen.getByTestId('monthly-payment');
    // $20,000 at 6.5% for 60 months ≈ $391.32
    expect(payment.textContent).toMatch(/\$\d+\.\d{2}/);
    const value = parseFloat(payment.textContent!.replace('$', ''));
    expect(value).toBeGreaterThan(380);
    expect(value).toBeLessThan(400);
  });

  it('updates loan amount when slider changes', () => {
    render(<PaymentCalculator />);
    const slider = screen.getByTestId('loan-amount-slider');
    fireEvent.change(slider, { target: { value: '40000' } });
    expect(screen.getByTestId('loan-amount-value')).toHaveTextContent('$40,000');
  });

  it('updates down payment when slider changes', () => {
    render(<PaymentCalculator />);
    const slider = screen.getByTestId('down-payment-slider');
    fireEvent.change(slider, { target: { value: '10000' } });
    expect(screen.getByTestId('down-payment-value')).toHaveTextContent('$10,000');
  });

  it('updates interest rate when slider changes', () => {
    render(<PaymentCalculator />);
    const slider = screen.getByTestId('interest-rate-slider');
    fireEvent.change(slider, { target: { value: '8.0' } });
    expect(screen.getByTestId('interest-rate-value')).toHaveTextContent('8.0%');
  });

  it('updates loan term when slider changes', () => {
    render(<PaymentCalculator />);
    const slider = screen.getByTestId('loan-term-slider');
    fireEvent.change(slider, { target: { value: '36' } });
    expect(screen.getByTestId('loan-term-value')).toHaveTextContent('36 months');
  });

  it('shows $0.00 when down payment exceeds loan amount', () => {
    render(<PaymentCalculator />);
    fireEvent.change(screen.getByTestId('down-payment-slider'), { target: { value: '50000' } });
    fireEvent.change(screen.getByTestId('loan-amount-slider'), { target: { value: '5000' } });
    expect(screen.getByTestId('monthly-payment')).toHaveTextContent('$0.00');
  });

  it('handles zero interest rate', () => {
    render(<PaymentCalculator />);
    fireEvent.change(screen.getByTestId('interest-rate-slider'), { target: { value: '0' } });
    const payment = screen.getByTestId('monthly-payment');
    const value = parseFloat(payment.textContent!.replace('$', ''));
    // $20,000 / 60 = $333.33
    expect(value).toBeGreaterThan(330);
    expect(value).toBeLessThan(340);
  });

  it('displays summary values', () => {
    render(<PaymentCalculator />);
    expect(screen.getByTestId('summary-principal')).toBeInTheDocument();
    expect(screen.getByTestId('summary-interest')).toBeInTheDocument();
    expect(screen.getByTestId('summary-total')).toBeInTheDocument();
  });
});
