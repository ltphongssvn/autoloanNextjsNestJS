import { Test } from '@nestjs/testing';
import { AgreementPdfService } from './agreement-pdf.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';

describe('AgreementPdfService', () => {
  let service: AgreementPdfService;
  const mockPrisma = { application: { findFirst: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AgreementPdfService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(AgreementPdfService);
    jest.clearAllMocks();
  });

  const approvedApp = {
    id: 1, applicationNumber: 'AL-0001', status: 'approved',
    loanAmount: '25000.00', downPayment: '5000.00', loanTerm: 60,
    interestRate: '5.99', monthlyPayment: '450.00', signedAt: null,
    user: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
  };

  it('generates agreement for approved application', async () => {
    mockPrisma.application.findFirst.mockResolvedValue(approvedApp);
    const result = await service.generate(1, 1);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('AL-0001');
    const content = result.buffer.toString();
    expect(content).toContain('AUTO LOAN AGREEMENT');
    expect(content).toContain('John Doe');
    expect(content).toContain('25000.00');
  });

  it('generates for signed application with signedAt', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, status: 'signed', signedAt: new Date() });
    const result = await service.generate(1, 1);
    expect(result.buffer.toString()).toContain('Signed');
  });

  it('uses fallback app number when applicationNumber is null', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, applicationNumber: null });
    const result = await service.generate(1, 1);
    expect(result.filename).toContain('APP-0001');
  });

  it('throws NotFoundException when application not found', async () => {
    mockPrisma.application.findFirst.mockResolvedValue(null);
    await expect(service.generate(1, 1)).rejects.toThrow(NotFoundException);
  });

  it('throws UnprocessableEntityException for draft application', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, status: 'draft' });
    await expect(service.generate(1, 1)).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws UnprocessableEntityException for submitted application', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, status: 'submitted' });
    await expect(service.generate(1, 1)).rejects.toThrow(UnprocessableEntityException);
  });

  it('handles missing user fields gracefully', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, user: null });
    const result = await service.generate(1, 1);
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('handles null loan fields', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({
      ...approvedApp, loanAmount: null, downPayment: null, loanTerm: null, interestRate: null, monthlyPayment: null,
    });
    const result = await service.generate(1, 1);
    expect(result.buffer.toString()).toContain('$0.00');
  });
});
