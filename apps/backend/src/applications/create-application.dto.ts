// apps/backend/src/applications/create-application.dto.ts

export class PersonalInfoDto {
  dob?: string;
  ssn?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  years_at_address?: number;
  months_at_address?: number;
}

export class CarDetailsDto {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  trim?: string;
  condition?: string;
  price?: number;
  mileage?: number;
}

export class LoanDetailsDto {
  amount?: number;
  down_payment?: number;
  term?: number;
  interest_rate?: number;
}

export class EmploymentInfoDto {
  employer?: string;
  job_title?: string;
  employment_status?: string;
  years?: number;
  months_employed?: number;
  income?: number;
  expenses?: number;
  credit_score?: number;
  other_income?: number;
}

export class CreateApplicationDto {
  // Legacy flat fields (backwards compat)
  loanAmount?: number;
  downPayment?: number;
  loanTerm?: number;
  dob?: string;

  // Nested fields (Rails-compatible)
  current_step?: number;
  personal_info?: PersonalInfoDto;
  car_details?: CarDetailsDto;
  loan_details?: LoanDetailsDto;
  employment_info?: EmploymentInfoDto;
}
