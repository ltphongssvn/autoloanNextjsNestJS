// apps/backend/src/applications/create-application.dto.spec.ts
import { CreateApplicationDto } from './create-application.dto';

describe('CreateApplicationDto', () => {
  it('should create with all fields', () => {
    const dto = new CreateApplicationDto();
    dto.loanAmount = 25000;
    dto.downPayment = 5000;
    dto.loanTerm = 60;
    dto.dob = '1990-01-01';
    dto.streetAddress = '123 Main St';
    dto.city = 'Westminster';
    dto.state = 'CA';
    dto.zipCode = '92683';
    dto.make = 'Toyota';
    dto.model = 'Camry';
    dto.year = 2024;
    dto.vin = '4T1BF1FK5GU123456';
    dto.estimatedValue = 32000;
    dto.employerName = 'Acme Corp';
    dto.jobTitle = 'Engineer';
    dto.annualIncome = 95000;
    dto.monthlyExpenses = 3000;
    expect(dto.loanAmount).toBe(25000);
    expect(dto.make).toBe('Toyota');
    expect(dto.annualIncome).toBe(95000);
  });

  it('should create with no fields', () => {
    const dto = new CreateApplicationDto();
    expect(dto.loanAmount).toBeUndefined();
    expect(dto.make).toBeUndefined();
  });

  it('should create with partial fields', () => {
    const dto = new CreateApplicationDto();
    dto.loanAmount = 30000;
    dto.loanTerm = 48;
    expect(dto.loanAmount).toBe(30000);
    expect(dto.loanTerm).toBe(48);
    expect(dto.downPayment).toBeUndefined();
  });
});
