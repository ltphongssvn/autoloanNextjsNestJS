-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'loan_officer', 'underwriter');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('draft', 'submitted', 'under_review', 'pending_documents', 'approved', 'rejected', 'signed');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('drivers_license', 'pay_stub', 'bank_statement', 'tax_return', 'proof_of_insurance', 'proof_of_residence', 'other');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('requested', 'uploaded', 'verified', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "encrypted_password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "jti" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "confirmation_token" TEXT,
    "confirmation_sent_at" TIMESTAMP(3),
    "reset_password_token" TEXT,
    "reset_password_sent_at" TIMESTAMP(3),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMP(3),
    "unlock_token" TEXT,
    "sign_in_count" INTEGER NOT NULL DEFAULT 0,
    "current_sign_in_at" TIMESTAMP(3),
    "last_sign_in_at" TIMESTAMP(3),
    "current_sign_in_ip" TEXT,
    "last_sign_in_ip" TEXT,
    "otp_secret" TEXT,
    "otp_required_for_login" BOOLEAN,
    "otp_backup_codes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "application_number" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'draft',
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "dob" DATE,
    "loan_amount" DECIMAL(10,2),
    "down_payment" DECIMAL(10,2),
    "loan_term" INTEGER,
    "interest_rate" DECIMAL(5,2),
    "monthly_payment" DECIMAL(10,2),
    "rejection_reason" TEXT,
    "signature_data" TEXT,
    "signed_at" TIMESTAMP(3),
    "agreement_accepted" BOOLEAN,
    "submitted_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "ssn_encrypted" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "address_type" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "years_at_address" INTEGER,
    "months_at_address" INTEGER,
    "application_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_infos" (
    "id" SERIAL NOT NULL,
    "annual_income" DECIMAL(12,2),
    "monthly_income" DECIMAL(10,2),
    "monthly_expenses" DECIMAL(10,2),
    "other_income" DECIMAL(10,2),
    "employer_name" TEXT,
    "job_title" TEXT,
    "employment_status" TEXT,
    "income_type" TEXT,
    "years_employed" INTEGER,
    "months_employed" INTEGER,
    "credit_score" INTEGER,
    "application_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" TEXT,
    "vin" TEXT,
    "mileage" INTEGER,
    "condition" TEXT,
    "estimated_value" DECIMAL(10,2),
    "application_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "doc_type" "DocumentType" NOT NULL DEFAULT 'other',
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "file_size" INTEGER,
    "content_type" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'requested',
    "request_note" TEXT,
    "rejection_note" TEXT,
    "uploaded_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verified_by_id" INTEGER,
    "application_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" SERIAL NOT NULL,
    "note" TEXT,
    "internal" BOOLEAN,
    "application_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_histories" (
    "id" SERIAL NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "comment" TEXT,
    "application_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jwt_denylists" (
    "id" SERIAL NOT NULL,
    "jti" TEXT,
    "exp" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jwt_denylists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key_digest" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_jti_key" ON "users"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "users_confirmation_token_key" ON "users"("confirmation_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_password_token_key" ON "users"("reset_password_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_unlock_token_key" ON "users"("unlock_token");

-- CreateIndex
CREATE UNIQUE INDEX "applications_application_number_key" ON "applications"("application_number");

-- CreateIndex
CREATE INDEX "applications_user_id_idx" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_user_id_status_idx" ON "applications"("user_id", "status");

-- CreateIndex
CREATE INDEX "addresses_application_id_idx" ON "addresses"("application_id");

-- CreateIndex
CREATE INDEX "addresses_application_id_address_type_idx" ON "addresses"("application_id", "address_type");

-- CreateIndex
CREATE INDEX "financial_infos_application_id_idx" ON "financial_infos"("application_id");

-- CreateIndex
CREATE INDEX "financial_infos_application_id_income_type_idx" ON "financial_infos"("application_id", "income_type");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_application_id_key" ON "vehicles"("application_id");

-- CreateIndex
CREATE INDEX "vehicles_make_model_year_idx" ON "vehicles"("make", "model", "year");

-- CreateIndex
CREATE INDEX "documents_application_id_idx" ON "documents"("application_id");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "application_notes_application_id_idx" ON "application_notes"("application_id");

-- CreateIndex
CREATE INDEX "status_histories_application_id_idx" ON "status_histories"("application_id");

-- CreateIndex
CREATE INDEX "jwt_denylists_jti_idx" ON "jwt_denylists"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_digest_key" ON "api_keys"("key_digest");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_key_digest_idx" ON "api_keys"("key_digest");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_infos" ADD CONSTRAINT "financial_infos_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
