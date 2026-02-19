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
  personal_info: Record<string, unknown>;
  car_details: Record<string, unknown>;
  loan_details: Record<string, unknown>;
  employment_info: Record<string, unknown>;
  loan_term: number | null;
  interest_rate: string | null;
  monthly_payment: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  signature_data: string | null;
  signed_at: string | null;
  agreement_accepted: boolean | null;
  created_at: string;
  updated_at: string;
  links?: ApplicationLinks;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'under_review'
  | 'pending_documents'
  | 'approved'
  | 'rejected';

export interface ApplicationLinks {
  self: string;
  documents: string;
  submit?: string;
  sign?: string;
  agreement_pdf?: string;
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
