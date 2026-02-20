// apps/backend/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const password = await bcrypt.hash('password123', 12); // pragma: allowlist secret

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      encryptedPassword: password, // pragma: allowlist secret
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0100',
      role: Role.customer,
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: 'officer@example.com' },
    update: {},
    create: {
      email: 'officer@example.com',
      encryptedPassword: password, // pragma: allowlist secret
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '555-0200',
      role: Role.loan_officer,
    },
  });

  const underwriter = await prisma.user.upsert({
    where: { email: 'underwriter@example.com' },
    update: {},
    create: {
      email: 'underwriter@example.com',
      encryptedPassword: password, // pragma: allowlist secret
      firstName: 'Bob',
      lastName: 'Wilson',
      phone: '555-0300',
      role: Role.underwriter,
    },
  });

  console.log('Seeded users:', { customer: customer.id, officer: officer.id, underwriter: underwriter.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
