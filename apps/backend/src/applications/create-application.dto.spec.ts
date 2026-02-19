// apps/backend/src/applications/create-application.dto.spec.ts
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateApplicationDto } from './create-application.dto';

describe('CreateApplicationDto', () => {
  it('should pass validation with valid optional fields', async () => {
    const dto = plainToInstance(CreateApplicationDto, {
      loanAmount: 25000,
      downPayment: 5000,
      loanTerm: 60,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with empty object', async () => {
    const dto = plainToInstance(CreateApplicationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when loanAmount is negative', async () => {
    const dto = plainToInstance(CreateApplicationDto, { loanAmount: -100 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('loanAmount');
  });

  it('should fail when loanTerm is less than 1', async () => {
    const dto = plainToInstance(CreateApplicationDto, { loanTerm: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('loanTerm');
  });

  it('should fail when loanAmount is not a number', async () => {
    const dto = plainToInstance(CreateApplicationDto, { loanAmount: 'abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
