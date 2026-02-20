// apps/backend/prisma/seed.ts
import { PrismaClient, Role, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.applicationNote.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.financialInfo.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.address.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jwtDenylist.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  console.log('Creating users...');
  const customer1 = await prisma.user.create({ data: { email: 'tiffany.chen@example.com', encryptedPassword: hash('password123'), firstName: 'Tiffany', lastName: 'Chen', phone: '7145551001', role: Role.customer, confirmedAt: new Date() } });
  const customer2 = await prisma.user.create({ data: { email: 'joseph.nguyen@example.com', encryptedPassword: hash('password123'), firstName: 'Joseph', lastName: 'Nguyen', phone: '7145551002', role: Role.customer, confirmedAt: new Date() } });
  const customer3 = await prisma.user.create({ data: { email: 'hai.pham@example.com', encryptedPassword: hash('password123'), firstName: 'Hai', lastName: 'Pham', phone: '7145551003', role: Role.customer, confirmedAt: new Date() } });
  const customer4 = await prisma.user.create({ data: { email: 'vivian.nguyen@example.com', encryptedPassword: hash('password123'), firstName: 'Vivian', lastName: 'Nguyen', phone: '7145551004', role: Role.customer, confirmedAt: new Date() } });
  const customer5 = await prisma.user.create({ data: { email: 'jason.hart@example.com', encryptedPassword: hash('password123'), firstName: 'Jason', lastName: 'Hart', phone: '7145551005', role: Role.customer, confirmedAt: new Date() } });

  // Test users
  const testCustomer1 = await prisma.user.create({ data: { email: 'ltphongssvn@gmail.com', encryptedPassword: hash('password123'), firstName: 'Phong', lastName: 'Le', phone: '7145559999', role: Role.customer, confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'dijali@gmail.com', encryptedPassword: hash('password123'), firstName: 'Dijali', lastName: 'Test', phone: '7145559998', role: Role.customer, confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'elena.bychenkova@gmail.com', encryptedPassword: hash('password123'), firstName: 'Elena', lastName: 'Bychenkova', phone: '7145559997', role: Role.customer, confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'tuladhar.shuveksha@gmail.com', encryptedPassword: hash('password123'), firstName: 'Shuveksha', lastName: 'Tuladhar', phone: '7145559996', role: Role.customer, confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'verafes@gmail.com', encryptedPassword: hash('password123'), firstName: 'Vera', lastName: 'Fes', phone: '7145559995', role: Role.customer, confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'gabhalley@gmail.com', encryptedPassword: hash('password123'), firstName: 'Gab', lastName: 'Halley', phone: '7145559994', role: Role.customer, confirmedAt: new Date() } });

  // Staff
  await prisma.user.create({ data: { email: 'officer@example.com', encryptedPassword: hash('password123'), firstName: 'Thuy', lastName: 'Nguyen', phone: '7145552001', role: Role.loan_officer, confirmedAt: new Date() } });
  await prisma.user.create({ data: { email: 'underwriter@example.com', encryptedPassword: hash('password123'), firstName: 'Loi', lastName: 'Luu', phone: '7145553001', role: Role.underwriter, confirmedAt: new Date() } });

  console.log('Creating applications...');
  let appNum = 1;
  const appNo = () => `AL-2026-${String(appNum++).padStart(5, '0')}`;
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

  interface AppInput {
    user: { id: number };
    status: ApplicationStatus;
    currentStep: number;
    personal: { dob: string; ssn?: string; address: string; city: string; state: string; zip: string; yearsAtAddress?: number; monthsAtAddress?: number };
    car?: { make: string; model: string; year: number; price: number; condition?: string; vin: string; mileage?: number };
    employment?: { employer: string; jobTitle: string; status: string; income: number; years: number; months?: number; expenses: number; creditScore: number };
    loan: { amount?: number; downPayment?: number };
    extra?: { submittedAt?: Date; decidedAt?: Date; loanTerm?: number; interestRate?: number; monthlyPayment?: number };
  }

  async function createApp(input: AppInput) {
    const app = await prisma.application.create({
      data: {
        applicationNumber: appNo(),
        userId: input.user.id,
        status: input.status,
        currentStep: input.currentStep,
        dob: new Date(input.personal.dob),
        ssnEncrypted: input.personal.ssn,
        loanAmount: input.loan.amount,
        downPayment: input.loan.downPayment,
        submittedAt: input.extra?.submittedAt,
        decidedAt: input.extra?.decidedAt,
        loanTerm: input.extra?.loanTerm,
        interestRate: input.extra?.interestRate,
        monthlyPayment: input.extra?.monthlyPayment,
      },
    });

    await prisma.address.create({
      data: {
        applicationId: app.id, addressType: 'residential',
        streetAddress: input.personal.address, city: input.personal.city,
        state: input.personal.state, zipCode: input.personal.zip,
        yearsAtAddress: input.personal.yearsAtAddress ?? 3, monthsAtAddress: input.personal.monthsAtAddress ?? 0,
      },
    });

    if (input.car) {
      await prisma.vehicle.create({
        data: {
          applicationId: app.id, make: input.car.make, model: input.car.model,
          year: input.car.year, vin: input.car.vin, condition: input.car.condition ?? 'new',
          estimatedValue: input.car.price, mileage: input.car.mileage ?? 0,
        },
      });
    }

    if (input.employment) {
      await prisma.financialInfo.create({
        data: {
          applicationId: app.id, incomeType: 'primary',
          employerName: input.employment.employer, jobTitle: input.employment.jobTitle,
          employmentStatus: input.employment.status, yearsEmployed: input.employment.years,
          monthsEmployed: input.employment.months ?? 0, annualIncome: input.employment.income,
          monthlyIncome: input.employment.income / 12, monthlyExpenses: input.employment.expenses,
          creditScore: input.employment.creditScore,
        },
      });
    }

    return app;
  }

  // Tiffany - Draft
  await createApp({ user: customer1, status: ApplicationStatus.draft, currentStep: 2, personal: { dob: '1988-03-15', ssn: '123-45-6789', address: '15464 Goldenwest St', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 5, monthsAtAddress: 3 }, car: { make: 'Toyota', model: 'Camry', year: 2024, price: 32000, vin: '4T1BF1FK5GU123456' }, loan: {} });

  // Joseph - Submitted
  await createApp({ user: customer2, status: ApplicationStatus.submitted, currentStep: 5, personal: { dob: '1985-07-22', ssn: '234-56-7890', address: '14571 Magnolia St, Suite 105', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 4, monthsAtAddress: 6 }, car: { make: 'Honda', model: 'Accord', year: 2024, price: 34000, vin: '1HGCV1F34PA012345' }, loan: { amount: 30000, downPayment: 5000 }, employment: { employer: 'Kindred Hospital Westminster', jobTitle: 'Pharmacist', status: 'full_time', income: 125000, years: 6, months: 8, expenses: 3500, creditScore: 780 }, extra: { submittedAt: new Date(), loanTerm: 48, interestRate: 5.9, monthlyPayment: 573.62 } });

  // Hai - Under Review
  await createApp({ user: customer3, status: ApplicationStatus.under_review, currentStep: 5, personal: { dob: '1990-11-08', ssn: '345-67-8901', address: '9600 Bolsa Ave', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 2, monthsAtAddress: 9 }, car: { make: 'Ford', model: 'F-150', year: 2024, price: 48000, vin: '1FTFW1E50PFA98765' }, loan: { amount: 42000, downPayment: 6000 }, employment: { employer: 'Westminster Police Department', jobTitle: 'Police Officer I', status: 'full_time', income: 102000, years: 4, months: 3, expenses: 2800, creditScore: 745 }, extra: { submittedAt: daysAgo(2), loanTerm: 60, interestRate: 6.5, monthlyPayment: 702.35 } });

  // Vivian - Under Review
  await createApp({ user: customer4, status: ApplicationStatus.under_review, currentStep: 5, personal: { dob: '1995-04-12', ssn: '456-78-9012', address: '8419 Westminster Blvd', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 1, monthsAtAddress: 6 }, car: { make: 'Honda', model: 'Civic', year: 2024, price: 28000, vin: '2HGFC2F59PH567890' }, loan: { amount: 25000, downPayment: 3000 }, employment: { employer: 'Extended Care Hospital of Westminster', jobTitle: 'Certified Nursing Assistant', status: 'full_time', income: 48000, years: 2, months: 4, expenses: 1800, creditScore: 680 }, extra: { submittedAt: daysAgo(1), loanTerm: 60, interestRate: 7.9, monthlyPayment: 449.18 } });

  // Jason - Under Review
  await createApp({ user: customer5, status: ApplicationStatus.under_review, currentStep: 5, personal: { dob: '1992-09-30', ssn: '567-89-0123', address: '15464 Goldenwest St', city: 'Westminster', state: 'CA', zip: '92683' }, car: { make: 'Tesla', model: 'Model 3', year: 2024, price: 42000, vin: '5YJ3E1EA5PF234567' }, loan: { amount: 38000, downPayment: 4000 }, employment: { employer: 'Westminster School District', jobTitle: 'Substitute Teacher', status: 'part_time', income: 42000, years: 3, months: 2, expenses: 2000, creditScore: 710 }, extra: { submittedAt: daysAgo(3), loanTerm: 60, interestRate: 7.5, monthlyPayment: 693.21 } });

  // Joseph - Pending Documents
  await createApp({ user: customer2, status: ApplicationStatus.pending_documents, currentStep: 5, personal: { dob: '1985-07-22', ssn: '234-56-7890', address: '14571 Magnolia St, Suite 105', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 4, monthsAtAddress: 6 }, car: { make: 'BMW', model: 'X3', year: 2023, price: 52000, condition: 'certified', vin: '5UXTY5C05N9B12345' }, loan: { amount: 45000, downPayment: 7000 }, employment: { employer: 'Kindred Hospital Westminster', jobTitle: 'Pharmacist', status: 'full_time', income: 125000, years: 6, months: 8, expenses: 3500, creditScore: 780 }, extra: { submittedAt: daysAgo(5), loanTerm: 48, interestRate: 6.9, monthlyPayment: 913.18 } });

  // Hai - Approved
  await createApp({ user: customer3, status: ApplicationStatus.approved, currentStep: 5, personal: { dob: '1990-11-08', ssn: '345-67-8901', address: '9600 Bolsa Ave', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 2, monthsAtAddress: 9 }, car: { make: 'Toyota', model: 'Tacoma', year: 2024, price: 38000, vin: '3TMCZ5AN5PM123456' }, loan: { amount: 32000, downPayment: 6000 }, employment: { employer: 'Westminster Police Department', jobTitle: 'Police Officer I', status: 'full_time', income: 102000, years: 4, months: 3, expenses: 2800, creditScore: 745 }, extra: { submittedAt: daysAgo(7), decidedAt: daysAgo(4), loanTerm: 60, interestRate: 6.5, monthlyPayment: 508.44 } });

  // Tiffany - Approved
  await createApp({ user: customer1, status: ApplicationStatus.approved, currentStep: 5, personal: { dob: '1988-03-15', ssn: '123-45-6789', address: '15464 Goldenwest St', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 5, monthsAtAddress: 3 }, car: { make: 'Lexus', model: 'RX 350', year: 2024, price: 52000, vin: '2T2HZMDA5PC123456' }, loan: { amount: 45000, downPayment: 7000 }, employment: { employer: 'Extended Care Hospital of Westminster', jobTitle: 'Registered Nurse', status: 'full_time', income: 95000, years: 5, months: 7, expenses: 3200, creditScore: 760 }, extra: { submittedAt: daysAgo(6), decidedAt: daysAgo(3), loanTerm: 48, interestRate: 5.9, monthlyPayment: 871.25 } });

  // Test user - Draft
  await createApp({ user: testCustomer1, status: ApplicationStatus.draft, currentStep: 1, personal: { dob: '1990-01-15', ssn: '999-88-7777', address: '10000 Bolsa Ave', city: 'Westminster', state: 'CA', zip: '92683', yearsAtAddress: 2 }, car: { make: 'Honda', model: 'CR-V', year: 2024, price: 35000, vin: '7FARW2H59PE000001' }, loan: {} });

  const userCount = await prisma.user.count();
  const appCount = await prisma.application.count();
  const vehicleCount = await prisma.vehicle.count();
  console.log(`Seed complete! Users: ${userCount}, Applications: ${appCount}, Vehicles: ${vehicleCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
