// apps/backend/src/applications/create-application.dto.spec.ts
import { CreateApplicationDto, PersonalInfoDto, CarDetailsDto, LoanDetailsDto, EmploymentInfoDto } from './create-application.dto';

describe('CreateApplicationDto', () => {
  it('should accept nested fields matching Rails structure', () => {
    const dto = new CreateApplicationDto();
    dto.personal_info = {
      dob: '1990-01-01',
      ssn: '123-45-6789',
      address: '123 Main St',
      city: 'Westminster',
      state: 'CA',
      zip: '92683',
      years_at_address: 3,
      months_at_address: 6,
    };
    dto.car_details = {
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      vin: '4T1BF1FK5GU123456',
      price: 32000,
    };
    dto.employment_info = {
      employer: 'Acme Corp',
      job_title: 'Engineer',
      income: 95000,
      expenses: 3000,
    };
    dto.loan_details = { amount: 25000, down_payment: 5000 };
    expect(dto.car_details.make).toBe('Toyota');
    expect(dto.employment_info.income).toBe(95000);
    expect(dto.personal_info.city).toBe('Westminster');
    expect(dto.loan_details.amount).toBe(25000);
  });

  it('should accept legacy flat fields', () => {
    const dto = new CreateApplicationDto();
    dto.loanAmount = 25000;
    dto.downPayment = 5000;
    dto.loanTerm = 60;
    dto.dob = '1990-01-01';
    expect(dto.loanAmount).toBe(25000);
  });

  it('should allow all fields to be optional', () => {
    const dto = new CreateApplicationDto();
    expect(dto.personal_info).toBeUndefined();
    expect(dto.car_details).toBeUndefined();
    expect(dto.loan_details).toBeUndefined();
    expect(dto.employment_info).toBeUndefined();
    expect(dto.loanAmount).toBeUndefined();
  });
});
