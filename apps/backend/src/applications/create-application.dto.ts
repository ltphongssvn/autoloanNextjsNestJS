// apps/backend/src/applications/create-application.dto.ts
export class CreateApplicationDto {
  loanAmount?: number;
  downPayment?: number;
  loanTerm?: number;
  dob?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  estimatedValue?: number;
  employerName?: string;
  jobTitle?: string;
  annualIncome?: number;
  monthlyExpenses?: number;
}
