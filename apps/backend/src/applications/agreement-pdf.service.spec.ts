// apps/backend/src/applications/agreement-pdf.service.spec.ts
import { AgreementPdfService } from './agreement-pdf.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';

describe('AgreementPdfService', () => {
  let service: AgreementPdfService;
  const mockPrisma = { application: { findFirst: jest.fn() } };
  const approvedApp = {
    id: 1, applicationNumber: 'AL-0001', status: 'approved', userId: 1,
    loanAmount: 25000, downPayment: 5000, loanTerm: 48, interestRate: 5.5, monthlyPayment: 450,
    signedAt: null, signatureData: null, agreementAccepted: null,
    user: { firstName: 'John', lastName: 'Doe', email: 'j@test.com', phone: '555-1234' },
    addresses: [{ addressType: 'residential', streetAddress: '123 Main', city: 'Springfield', state: 'IL', zipCode: '62701' }],
    vehicles: [{ make: 'Toyota', model: 'Camry', year: 2023, vin: 'VIN123', trim: 'SE', condition: 'new', estimatedValue: 28000, mileage: 15 }],
    financialInfos: [],
  };

  beforeEach(() => {
    service = new AgreementPdfService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  it('generates a real PDF for approved application', async () => {
    mockPrisma.application.findFirst.mockResolvedValue(approvedApp);
    const result = await service.generate(1, 1);
    expect(result.filename).toBe('loan_agreement_AL-0001.pdf');
    expect(result.buffer).toBeInstanceOf(Buffer);
    // Verify PDF magic bytes
    expect(result.buffer.toString('ascii', 0, 5)).toBe('%PDF-');
    // Verify it contains PDF structure markers
    const raw = result.buffer.toString('binary');
    expect(raw).toContain('endobj');
    expect(raw).toContain('%%EOF');
    // Verify fonts are embedded (Helvetica used in our doc)
    expect(raw).toContain('/Helvetica');
  });

  it('generates PDF for signed application with signedAt', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, status: 'signed', signedAt: new Date() });
    const result = await service.generate(1, 1);
    expect(result.buffer.toString('ascii', 0, 5)).toBe('%PDF-');
    expect(result.filename).toContain('.pdf');
  });

  it('uses fallback app number when applicationNumber is null', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, applicationNumber: null });
    const result = await service.generate(1, 1);
    expect(result.filename).toBe('loan_agreement_APP-0001.pdf');
  });

  it('throws NotFoundException when application not found', async () => {
    mockPrisma.application.findFirst.mockResolvedValue(null);
    await expect(service.generate(99, 1)).rejects.toThrow(NotFoundException);
  });

  it('throws UnprocessableEntityException for draft status', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, status: 'draft' });
    await expect(service.generate(1, 1)).rejects.toThrow(UnprocessableEntityException);
  });

  it('handles null loan fields gracefully', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({
      ...approvedApp, loanAmount: null, downPayment: null, loanTerm: null, interestRate: null, monthlyPayment: null,
      vehicles: [], addresses: [],
    });
    const result = await service.generate(1, 1);
    expect(result.buffer.toString('ascii', 0, 5)).toBe('%PDF-');
  });

  it('handles null user gracefully', async () => {
    mockPrisma.application.findFirst.mockResolvedValue({ ...approvedApp, user: null });
    const result = await service.generate(1, 1);
    expect(result.buffer.toString('ascii', 0, 5)).toBe('%PDF-');
  });
});
