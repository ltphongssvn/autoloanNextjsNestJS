// apps/backend/src/applications/application.serializer.ts

interface SerializeOptions {
  currentUserId?: number;
}

export function serializeApplication(app: any, options?: SerializeOptions) {
  const isOwner = options?.currentUserId && options.currentUserId === app.userId;

  // personal_info from user + residential address
  const address = app.addresses?.find((a: any) => a.addressType === 'residential');
  const personal_info = {
    first_name: app.user?.firstName || null,
    last_name: app.user?.lastName || null,
    email: app.user?.email || null,
    phone: app.user?.phone || null,
    dob: app.dob ? app.dob.toISOString().split('T')[0] : null,
    ssn: isOwner ? app.ssnEncrypted : null,
    address: address?.streetAddress || null,
    city: address?.city || null,
    state: address?.state || null,
    zip: address?.zipCode || null,
    years_at_address: address?.yearsAtAddress?.toString() || null,
    months_at_address: address?.monthsAtAddress?.toString() || null,
  };

  // car_details from vehicle (first vehicle or unique)
  const vehicle = app.vehicles?.[0];
  const car_details = vehicle
    ? {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year?.toString(),
        vin: vehicle.vin || null,
        trim: vehicle.trim || null,
        condition: vehicle.condition || null,
        price: vehicle.estimatedValue?.toString() || null,
        mileage: vehicle.mileage?.toString() || null,
      }
    : {};

  // loan_details from application fields
  const loan_details = {
    amount: app.loanAmount?.toString() || null,
    down_payment: app.downPayment?.toString() || null,
  };

  // employment_info from primary financial_info
  const fi = app.financialInfos?.find((f: any) => f.incomeType === 'primary');
  const employment_info = fi
    ? {
        employer: fi.employerName || null,
        job_title: fi.jobTitle || null,
        employment_status: fi.employmentStatus || null,
        years: fi.yearsEmployed?.toString() || null,
        months_employed: fi.monthsEmployed?.toString() || null,
        income: fi.annualIncome?.toString() || null,
        expenses: fi.monthlyExpenses?.toString() || null,
        credit_score: fi.creditScore?.toString() || null,
        other_income: fi.otherIncome?.toString() || null,
      }
    : {};

  // HATEOAS links
  const baseUrl = `/api/v1/applications/${app.id}`;
  const links: Record<string, string> = {
    self: baseUrl,
    documents: `${baseUrl}/documents`,
  };
  if (app.status === 'draft') {
    links.submit = `${baseUrl}/submit`;
  }
  if (app.status === 'approved') {
    links.sign = `${baseUrl}/sign`;
    links.agreement_pdf = `${baseUrl}/agreement_pdf`;
  }

  return {
    id: app.id,
    application_number: app.applicationNumber,
    status: app.status,
    current_step: app.currentStep,
    loan_term: app.loanTerm,
    interest_rate: app.interestRate,
    monthly_payment: app.monthlyPayment,
    loan_amount: app.loanAmount,
    down_payment: app.downPayment,
    dob: app.dob,
    submitted_at: app.submittedAt,
    decided_at: app.decidedAt,
    signature_data: app.signatureData,
    signed_at: app.signedAt,
    agreement_accepted: app.agreementAccepted,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
    links,
    personal_info,
    car_details,
    loan_details,
    employment_info,
    documents: app.documents || [],
    status_histories: app.statusHistories || [],
  };
}
