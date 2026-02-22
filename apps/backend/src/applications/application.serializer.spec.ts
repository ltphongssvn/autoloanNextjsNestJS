// apps/backend/src/applications/application.serializer.spec.ts
import { serializeApplication } from './application.serializer';

describe('serializeApplication', () => {
  const baseApp = {
    id: 1,
    applicationNumber: 'AL-000001',
    status: 'draft',
    currentStep: 2,
    loanTerm: 60,
    interestRate: 5.5,
    monthlyPayment: 450,
    loanAmount: 25000,
    downPayment: 5000,
    dob: new Date('1990-06-15'),
    submittedAt: null,
    decidedAt: null,
    signatureData: null,
    signedAt: null,
    agreementAccepted: null,
    ssnEncrypted: '123-45-6789',
    userId: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    user: { firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '555-1234' },
    addresses: [{ addressType: 'residential', streetAddress: '123 Main St', city: 'Springfield', state: 'IL', zipCode: '62701', yearsAtAddress: 3, monthsAtAddress: 6 }],
    vehicles: [{ make: 'Toyota', model: 'Camry', year: 2023, vin: 'ABC123', trim: 'SE', condition: 'new', estimatedValue: 28000, mileage: 15 }],
    financialInfos: [{ incomeType: 'primary', employerName: 'Acme', jobTitle: 'Engineer', employmentStatus: 'full_time', yearsEmployed: 5, monthsEmployed: 2, annualIncome: 120000, monthlyExpenses: 3000, creditScore: 750, otherIncome: 5000 }],
    documents: [{ id: 1, docType: 'pay_stub' }],
    statusHistories: [{ id: 1, fromStatus: 'draft', toStatus: 'submitted' }],
  };

  it('should serialize all top-level fields with snake_case keys', () => {
    const result = serializeApplication(baseApp, { currentUserId: 1 });
    expect(result.application_number).toBe('AL-000001');
    expect(result.current_step).toBe(2);
    expect(result.loan_term).toBe(60);
    expect(result.loan_amount).toBe(25000);
    expect(result.down_payment).toBe(5000);
  });

  it('should build personal_info from user and address', () => {
    const result = serializeApplication(baseApp, { currentUserId: 1 });
    expect(result.personal_info.first_name).toBe('John');
    expect(result.personal_info.email).toBe('john@test.com');
    expect(result.personal_info.dob).toBe('1990-06-15');
    expect(result.personal_info.address).toBe('123 Main St');
    expect(result.personal_info.city).toBe('Springfield');
    expect(result.personal_info.years_at_address).toBe('3');
  });

  it('should include SSN for owner', () => {
    const result = serializeApplication(baseApp, { currentUserId: 1 });
    expect(result.personal_info.ssn).toBe('123-45-6789');
  });

  it('should hide SSN from non-owner', () => {
    const result = serializeApplication(baseApp, { currentUserId: 99 });
    expect(result.personal_info.ssn).toBeNull();
  });

  it('should hide SSN when no currentUserId', () => {
    const result = serializeApplication(baseApp);
    expect(result.personal_info.ssn).toBeNull();
  });

  it('should build car_details from vehicle', () => {
    const result = serializeApplication(baseApp);
    expect(result.car_details).toEqual({
      make: 'Toyota', model: 'Camry', year: '2023', vin: 'ABC123',
      trim: 'SE', condition: 'new', price: '28000', mileage: '15',
    });
  });

  it('should return empty object when no vehicle', () => {
    const result = serializeApplication({ ...baseApp, vehicles: [] });
    expect(result.car_details).toEqual({});
  });

  it('should build loan_details from application fields', () => {
    const result = serializeApplication(baseApp);
    expect(result.loan_details).toEqual({ amount: '25000', down_payment: '5000' });
  });

  it('should build employment_info from financial_info', () => {
    const result = serializeApplication(baseApp);
    expect(result.employment_info.employer).toBe('Acme');
    expect(result.employment_info.income).toBe('120000');
    expect(result.employment_info.credit_score).toBe('750');
  });

  it('should return empty object when no financial_info', () => {
    const result = serializeApplication({ ...baseApp, financialInfos: [] });
    expect(result.employment_info).toEqual({});
  });

  it('should include submit link for draft', () => {
    const result = serializeApplication(baseApp);
    expect(result.links.self).toBe('/api/v1/applications/1');
    expect(result.links.submit).toBe('/api/v1/applications/1/submit');
    expect(result.links.sign).toBeUndefined();
  });

  it('should include sign and pdf links for approved', () => {
    const result = serializeApplication({ ...baseApp, status: 'approved' });
    expect(result.links.sign).toBe('/api/v1/applications/1/sign');
    expect(result.links.agreement_pdf).toBe('/api/v1/applications/1/agreement_pdf');
    expect(result.links.submit).toBeUndefined();
  });

  it('should include documents and status_histories', () => {
    const result = serializeApplication(baseApp);
    expect(result.documents).toHaveLength(1);
    expect(result.status_histories).toHaveLength(1);
  });

  it('should handle null addresses gracefully', () => {
    const result = serializeApplication({ ...baseApp, addresses: [] });
    expect(result.personal_info.address).toBeNull();
    expect(result.personal_info.city).toBeNull();
  });

  it('should handle null dob', () => {
    const result = serializeApplication({ ...baseApp, dob: null });
    expect(result.personal_info.dob).toBeNull();
  });

  it('should handle null loan values', () => {
    const result = serializeApplication({ ...baseApp, loanAmount: null, downPayment: null });
    expect(result.loan_details).toEqual({ amount: null, down_payment: null });
  });

  // Additional branch coverage tests
  it('should handle null user', () => {
    const result = serializeApplication({ ...baseApp, user: null });
    expect(result.personal_info.first_name).toBeNull();
    expect(result.personal_info.last_name).toBeNull();
    expect(result.personal_info.email).toBeNull();
    expect(result.personal_info.phone).toBeNull();
  });

  it('should handle undefined user', () => {
    const result = serializeApplication({ ...baseApp, user: undefined });
    expect(result.personal_info.first_name).toBeNull();
    expect(result.personal_info.email).toBeNull();
  });

  it('should handle vehicle with null optional fields', () => {
    const result = serializeApplication({
      ...baseApp,
      vehicles: [{ make: 'Honda', model: 'Civic', year: 2024, vin: null, trim: null, condition: null, estimatedValue: null, mileage: null }],
    });
    expect(result.car_details.make).toBe('Honda');
    expect(result.car_details.vin).toBeNull();
    expect(result.car_details.trim).toBeNull();
    expect(result.car_details.condition).toBeNull();
    expect(result.car_details.price).toBeNull();
    expect(result.car_details.mileage).toBeNull();
  });

  it('should handle financial_info with null optional fields', () => {
    const result = serializeApplication({
      ...baseApp,
      financialInfos: [{ incomeType: 'primary', employerName: null, jobTitle: null, employmentStatus: null, yearsEmployed: null, monthsEmployed: null, annualIncome: null, monthlyExpenses: null, creditScore: null, otherIncome: null }],
    });
    expect(result.employment_info.employer).toBeNull();
    expect(result.employment_info.job_title).toBeNull();
    expect(result.employment_info.employment_status).toBeNull();
    expect(result.employment_info.years).toBeNull();
    expect(result.employment_info.months_employed).toBeNull();
    expect(result.employment_info.income).toBeNull();
    expect(result.employment_info.expenses).toBeNull();
    expect(result.employment_info.credit_score).toBeNull();
    expect(result.employment_info.other_income).toBeNull();
  });

  it('should handle undefined addresses/vehicles/financialInfos arrays', () => {
    const result = serializeApplication({
      ...baseApp,
      addresses: undefined,
      vehicles: undefined,
      financialInfos: undefined,
      documents: undefined,
      statusHistories: undefined,
    });
    expect(result.personal_info.address).toBeNull();
    expect(result.car_details).toEqual({});
    expect(result.employment_info).toEqual({});
    expect(result.documents).toEqual([]);
    expect(result.status_histories).toEqual([]);
  });

  it('should not include submit/sign links for submitted status', () => {
    const result = serializeApplication({ ...baseApp, status: 'submitted' });
    expect(result.links.self).toBeDefined();
    expect(result.links.documents).toBeDefined();
    expect(result.links.submit).toBeUndefined();
    expect(result.links.sign).toBeUndefined();
  });

  it('should handle address with null yearsAtAddress/monthsAtAddress', () => {
    const result = serializeApplication({
      ...baseApp,
      addresses: [{ addressType: 'residential', streetAddress: '1 St', city: 'X', state: 'Y', zipCode: '00000', yearsAtAddress: null, monthsAtAddress: null }],
    });
    expect(result.personal_info.years_at_address).toBeNull();
    expect(result.personal_info.months_at_address).toBeNull();
  });

  it('should skip non-residential addresses', () => {
    const result = serializeApplication({
      ...baseApp,
      addresses: [{ addressType: 'mailing', streetAddress: '999 Other St', city: 'Z', state: 'Q', zipCode: '11111', yearsAtAddress: 1, monthsAtAddress: 0 }],
    });
    expect(result.personal_info.address).toBeNull();
  });

  it('should skip non-primary financial_info', () => {
    const result = serializeApplication({
      ...baseApp,
      financialInfos: [{ incomeType: 'secondary', employerName: 'Side', annualIncome: 10000 }],
    });
    expect(result.employment_info).toEqual({});
  });
});
