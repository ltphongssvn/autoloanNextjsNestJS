import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.applicationNote.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.financialInfo.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.address.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jwtDenylist.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);
  const pw = hash('password123'); // pragma: allowlist secret

  console.log('Creating users...');
  const customer1 = await prisma.user.create({ data: { email: 'tiffany.chen@example.com', encryptedPassword: pw, firstName: 'Tiffany', lastName: 'Chen', phone: '714-555-1001', role: 'customer', confirmedAt: new Date() } });
  const customer2 = await prisma.user.create({ data: { email: 'joseph.nguyen@example.com', encryptedPassword: pw, firstName: 'Joseph', lastName: 'Nguyen', phone: '714-555-1002', role: 'customer', confirmedAt: new Date() } });
  const customer3 = await prisma.user.create({ data: { email: 'hai.pham@example.com', encryptedPassword: pw, firstName: 'Hai', lastName: 'Pham', phone: '714-555-1003', role: 'customer', confirmedAt: new Date() } });
  const customer4 = await prisma.user.create({ data: { email: 'vivian.nguyen@example.com', encryptedPassword: pw, firstName: 'Vivian', lastName: 'Nguyen', phone: '714-555-1004', role: 'customer', confirmedAt: new Date() } });
  const customer5 = await prisma.user.create({ data: { email: 'jason.hart@example.com', encryptedPassword: pw, firstName: 'Jason', lastName: 'Hart', phone: '714-555-1005', role: 'customer', confirmedAt: new Date() } });

  const testCustomer1 = await prisma.user.create({ data: { email: 'ltphongssvn@gmail.com', encryptedPassword: pw, firstName: 'Phong', lastName: 'Le', phone: '714-555-9999', role: 'customer', confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'dijali@gmail.com', encryptedPassword: pw, firstName: 'Dijali', lastName: 'Test', phone: '714-555-9998', role: 'customer', confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'elena.bychenkova@gmail.com', encryptedPassword: pw, firstName: 'Elena', lastName: 'Bychenkova', phone: '714-555-9997', role: 'customer', confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'tuladhar.shuveksha@gmail.com', encryptedPassword: pw, firstName: 'Shuveksha', lastName: 'Tuladhar', phone: '714-555-9996', role: 'customer', confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'verafes@gmail.com', encryptedPassword: pw, firstName: 'Vera', lastName: 'Fes', phone: '714-555-9995', role: 'customer', confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'gabhalley@gmail.com', encryptedPassword: pw, firstName: 'Gab', lastName: 'Halley', phone: '714-555-9994', role: 'customer', confirmedAt: new Date() } });

  await prisma.user.create({ data: { email: 'officer@example.com', encryptedPassword: pw, firstName: 'Thuy', lastName: 'Nguyen', phone: '714-555-2001', role: 'loan_officer', confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'underwriter@example.com', encryptedPassword: pw, firstName: 'Loi', lastName: 'Luu', phone: '714-555-3001', role: 'underwriter', confirmedAt: new Date() } });

  console.log('Creating applications...');

  // Helper
  async function createApp(opts: {
    userId: number; status: any; currentStep: number; dob?: string; ssn?: string;
    loanAmount?: number; downPayment?: number; loanTerm?: number; interestRate?: number; monthlyPayment?: number;
    submittedAt?: Date; decidedAt?: Date; appNumber?: string;
    address: { street: string; city: string; state: string; zip: string; years: number; months: number };
    car?: { make: string; model: string; year: number; vin: string; condition: string; price: number; mileage?: number };
    employment?: { employer: string; jobTitle: string; status: string; income: number; years: number; months: number; expenses: number; creditScore: number; otherIncome?: number };
  }) {
    const app = await prisma.application.create({
      data: {
        userId: opts.userId, status: opts.status, currentStep: opts.currentStep,
        dob: opts.dob ? new Date(opts.dob) : null, ssnEncrypted: opts.ssn || null,
        loanAmount: opts.loanAmount || null, downPayment: opts.downPayment || null,
        loanTerm: opts.loanTerm || null, interestRate: opts.interestRate || null,
        monthlyPayment: opts.monthlyPayment || null, submittedAt: opts.submittedAt || null,
        decidedAt: opts.decidedAt || null, applicationNumber: opts.appNumber || null,
      },
    });
    await prisma.address.create({
      data: {
        applicationId: app.id, addressType: 'residential', streetAddress: opts.address.street,
        city: opts.address.city, state: opts.address.state, zipCode: opts.address.zip,
        yearsAtAddress: opts.address.years, monthsAtAddress: opts.address.months,
      },
    });
    if (opts.car) {
      await prisma.vehicle.create({
        data: {
          applicationId: app.id, make: opts.car.make, model: opts.car.model, year: opts.car.year,
          vin: opts.car.vin, condition: opts.car.condition, estimatedValue: opts.car.price, mileage: opts.car.mileage || 0,
        },
      });
    }
    if (opts.employment) {
      await prisma.financialInfo.create({
        data: {
          applicationId: app.id, incomeType: 'primary', employerName: opts.employment.employer,
          jobTitle: opts.employment.jobTitle, employmentStatus: opts.employment.status,
          yearsEmployed: opts.employment.years, monthsEmployed: opts.employment.months,
          annualIncome: opts.employment.income, monthlyIncome: opts.employment.income / 12,
          monthlyExpenses: opts.employment.expenses, creditScore: opts.employment.creditScore,
          otherIncome: opts.employment.otherIncome || 0,
        },
      });
    }
    return app;
  }

  // 1. Tiffany - Draft
  await createApp({
    userId: customer1.id, status: 'draft', currentStep: 2, appNumber: 'AL-0001',
    dob: '1988-03-15', ssn: '123-45-6789',
    address: { street: '15464 Goldenwest St', city: 'Westminster', state: 'CA', zip: '92683', years: 5, months: 3 },
    car: { make: 'Toyota', model: 'Camry', year: 2024, price: 32000, condition: 'new', vin: '4T1BF1FK5GU123456' },
  });

  // 2. Joseph - Submitted
  await createApp({
    userId: customer2.id, status: 'submitted', currentStep: 5, appNumber: 'AL-0002',
    dob: '1985-07-22', ssn: '234-56-7890', loanAmount: 30000, downPayment: 5000, loanTerm: 48, interestRate: 5.9, monthlyPayment: 573.62,
    submittedAt: new Date(),
    address: { street: '14571 Magnolia St, Suite 105', city: 'Westminster', state: 'CA', zip: '92683', years: 4, months: 6 },
    car: { make: 'Honda', model: 'Accord', year: 2024, price: 34000, condition: 'new', vin: '1HGCV1F34PA012345' },
    employment: { employer: 'Kindred Hospital Westminster', jobTitle: 'Pharmacist', status: 'full_time', income: 125000, years: 6, months: 8, expenses: 3500, creditScore: 780 },
  });

  // 3. Hai - Under Review
  await createApp({
    userId: customer3.id, status: 'under_review', currentStep: 5, appNumber: 'AL-0003',
    dob: '1990-11-08', ssn: '345-67-8901', loanAmount: 42000, downPayment: 6000, loanTerm: 60, interestRate: 6.5, monthlyPayment: 702.35,
    submittedAt: new Date(Date.now() - 2 * 86400000),
    address: { street: '9600 Bolsa Ave', city: 'Westminster', state: 'CA', zip: '92683', years: 2, months: 9 },
    car: { make: 'Ford', model: 'F-150', year: 2024, price: 48000, condition: 'new', vin: '1FTFW1E50PFA98765' },
    employment: { employer: 'Westminster Police Department', jobTitle: 'Police Officer I', status: 'full_time', income: 102000, years: 4, months: 3, expenses: 2800, creditScore: 745 },
  });

  // 4. Vivian - Under Review
  await createApp({
    userId: customer4.id, status: 'under_review', currentStep: 5, appNumber: 'AL-0004',
    dob: '1995-04-12', ssn: '456-78-9012', loanAmount: 25000, downPayment: 3000, loanTerm: 60, interestRate: 7.9, monthlyPayment: 449.18,
    submittedAt: new Date(Date.now() - 86400000),
    address: { street: '8419 Westminster Blvd', city: 'Westminster', state: 'CA', zip: '92683', years: 1, months: 6 },
    car: { make: 'Honda', model: 'Civic', year: 2024, price: 28000, condition: 'new', vin: '2HGFC2F59PH567890' },
    employment: { employer: 'Extended Care Hospital of Westminster', jobTitle: 'Certified Nursing Assistant', status: 'full_time', income: 48000, years: 2, months: 4, expenses: 1800, creditScore: 680 },
  });

  // 5. Jason - Under Review
  await createApp({
    userId: customer5.id, status: 'under_review', currentStep: 5, appNumber: 'AL-0005',
    dob: '1992-09-30', ssn: '567-89-0123', loanAmount: 38000, downPayment: 4000, loanTerm: 60, interestRate: 7.5, monthlyPayment: 693.21,
    submittedAt: new Date(Date.now() - 3 * 86400000),
    address: { street: '15464 Goldenwest St', city: 'Westminster', state: 'CA', zip: '92683', years: 3, months: 0 },
    car: { make: 'Tesla', model: 'Model 3', year: 2024, price: 42000, condition: 'new', vin: '5YJ3E1EA5PF234567' },
    employment: { employer: 'Westminster School District', jobTitle: 'Substitute Teacher', status: 'part_time', income: 42000, years: 3, months: 2, expenses: 2000, creditScore: 710 },
  });

  // 6. Joseph - Pending Documents
  await createApp({
    userId: customer2.id, status: 'pending_documents', currentStep: 5, appNumber: 'AL-0006',
    dob: '1985-07-22', ssn: '234-56-7890', loanAmount: 45000, downPayment: 7000, loanTerm: 48, interestRate: 6.9, monthlyPayment: 913.18,
    submittedAt: new Date(Date.now() - 5 * 86400000),
    address: { street: '14571 Magnolia St, Suite 105', city: 'Westminster', state: 'CA', zip: '92683', years: 4, months: 6 },
    car: { make: 'BMW', model: 'X3', year: 2023, price: 52000, condition: 'certified', vin: '5UXTY5C05N9B12345' },
    employment: { employer: 'Kindred Hospital Westminster', jobTitle: 'Pharmacist', status: 'full_time', income: 125000, years: 6, months: 8, expenses: 3500, creditScore: 780 },
  });

  // 7. Hai - Approved
  await createApp({
    userId: customer3.id, status: 'approved', currentStep: 5, appNumber: 'AL-0007',
    dob: '1990-11-08', ssn: '345-67-8901', loanAmount: 32000, downPayment: 6000, loanTerm: 60, interestRate: 6.5, monthlyPayment: 508.44,
    submittedAt: new Date(Date.now() - 7 * 86400000), decidedAt: new Date(Date.now() - 4 * 86400000),
    address: { street: '9600 Bolsa Ave', city: 'Westminster', state: 'CA', zip: '92683', years: 2, months: 9 },
    car: { make: 'Toyota', model: 'Tacoma', year: 2024, price: 38000, condition: 'new', vin: '3TMCZ5AN5PM123456' },
    employment: { employer: 'Westminster Police Department', jobTitle: 'Police Officer I', status: 'full_time', income: 102000, years: 4, months: 3, expenses: 2800, creditScore: 745 },
  });

  // 8. Tiffany - Approved
  await createApp({
    userId: customer1.id, status: 'approved', currentStep: 5, appNumber: 'AL-0008',
    dob: '1988-03-15', ssn: '123-45-6789', loanAmount: 45000, downPayment: 7000, loanTerm: 48, interestRate: 5.9, monthlyPayment: 871.25,
    submittedAt: new Date(Date.now() - 6 * 86400000), decidedAt: new Date(Date.now() - 3 * 86400000),
    address: { street: '15464 Goldenwest St', city: 'Westminster', state: 'CA', zip: '92683', years: 5, months: 3 },
    car: { make: 'Lexus', model: 'RX 350', year: 2024, price: 52000, condition: 'new', vin: '2T2HZMDA5PC123456' },
    employment: { employer: 'Extended Care Hospital of Westminster', jobTitle: 'Registered Nurse', status: 'full_time', income: 95000, years: 5, months: 7, expenses: 3200, creditScore: 760 },
  });

  // 9. Test user - Draft
  await createApp({
    userId: testCustomer1.id, status: 'draft', currentStep: 1, appNumber: 'AL-0009',
    dob: '1990-01-15', ssn: '999-88-7777',
    address: { street: '10000 Bolsa Ave', city: 'Westminster', state: 'CA', zip: '92683', years: 2, months: 0 },
    car: { make: 'Honda', model: 'CR-V', year: 2024, price: 35000, condition: 'new', vin: '7FARW2H59PE000001' },
  });

  const users = await prisma.user.count();
  const apps = await prisma.application.count();
  const vehicles = await prisma.vehicle.count();
  const addresses = await prisma.address.count();
  const financials = await prisma.financialInfo.count();
  console.log(`Seed complete! Users: ${users}, Applications: ${apps}, Vehicles: ${vehicles}, Addresses: ${addresses}, FinancialInfos: ${financials}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
