// packages/shared-types/src/index.ts
// Shared TypeScript types for Auto Loan App (Next.js + NestJS)

// ── User ──
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export type UserRole = 'customer' | 'loan_officer' | 'underwriter';

// ── Application ──
export interface Application {
  id: number;
  user_id: number;
  application_number: string;
  status: ApplicationStatus;
  current_step: number;
  dob: string | null;
  ssn_encrypted: string | null;
  loan_amount: string | null;
  down_payment: string | null;
  loan_term: number | null;
  interest_rate: string | null;
  monthly_payment: string | null;
  rejection_reason: string | null;
  signature_data: string | null;
  signed_at: string | null;
  agreement_accepted: boolean | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  addresses?: Address[];
  vehicles?: Vehicle[];
  financial_infos?: FinancialInfo[];
  documents?: LoanDocument[];
  links?: ApplicationLinks;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'under_review'
  | 'pending_documents'
  | 'approved'
  | 'rejected'
  | 'signed';

export interface ApplicationLinks {
  self: string;
  documents: string;
  submit?: string;
  sign?: string;
  agreement_pdf?: string;
}

// ── Address ──
export interface Address {
  id: number;
  address_type: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  years_at_address: number | null;
  months_at_address: number | null;
}

// ── Vehicle ──
export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  condition: string | null;
  estimated_value: string | null;
  mileage: number | null;
}

// ── FinancialInfo ──
export interface FinancialInfo {
  id: number;
  income_type: string | null;
  employer_name: string | null;
  job_title: string | null;
  employment_status: string | null;
  years_employed: number | null;
  months_employed: number | null;
  annual_income: string | null;
  monthly_income: string | null;
  monthly_expenses: string | null;
  credit_score: number | null;
}

// ── Document ──
export interface LoanDocument {
  id: number;
  doc_type: DocumentType;
  file_name: string;
  file_url: string | null;
  file_size: number | null;
  content_type: string | null;
  status: DocumentStatus;
  rejection_note: string | null;
  request_note: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
  created_at: string;
}

export type DocumentType =
  | 'drivers_license'
  | 'proof_income'
  | 'proof_address'
  | 'bank_statement'
  | 'vehicle_purchase'
  | 'insurance'
  | 'other';

export type DocumentStatus = 'pending' | 'verified' | 'rejected' | 'requested';

// ── StatusHistory ──
export interface StatusHistory {
  id: number;
  from_status: string | null;
  to_status: string | null;
  comment: string | null;
  user_id: number;
  created_at: string;
}

// ── API ──
export interface ApiResponse<T> {
  status: { code: number; message?: string };
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

// ── Auth ──
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData extends AuthCredentials {
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
}
