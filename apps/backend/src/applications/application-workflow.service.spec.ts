// apps/backend/src/applications/application-workflow.service.spec.ts
import { UnprocessableEntityException } from '@nestjs/common';
import { ApplicationWorkflowService } from './application-workflow.service';
import { PrismaService } from '../prisma.service';

describe('ApplicationWorkflowService', () => {
  let service: ApplicationWorkflowService;
  const mockPrisma = {
    application: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    statusHistory: { create: jest.fn() },
  };

  beforeEach(() => {
    service = new ApplicationWorkflowService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
    mockPrisma.statusHistory.create.mockResolvedValue({});
  });

  describe('canTransitionTo', () => {
    it('allows draft -> submitted', () => {
      expect(service.canTransitionTo('draft', 'submitted')).toBe(true);
    });
    it('blocks draft -> approved', () => {
      expect(service.canTransitionTo('draft', 'approved')).toBe(false);
    });
    it('allows under_review -> approved', () => {
      expect(service.canTransitionTo('under_review', 'approved')).toBe(true);
    });
    it('allows under_review -> rejected', () => {
      expect(service.canTransitionTo('under_review', 'rejected')).toBe(true);
    });
    it('returns false for unknown status', () => {
      expect(service.canTransitionTo('unknown_status', 'approved')).toBe(false);
    });
    it('allows pending_documents -> under_review', () => {
      expect(service.canTransitionTo('pending_documents', 'under_review')).toBe(true);
    });
    it('allows submitted -> pending_documents', () => {
      expect(service.canTransitionTo('submitted', 'pending_documents')).toBe(true);
    });
  });

  describe('submit', () => {
    it('transitions draft to submitted', async () => {
      const app = { id: 1, status: 'draft' };
      const updated = { ...app, status: 'submitted', submittedAt: expect.any(Date) };
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue(updated);
      const result = await service.submit(1, 10);
      expect(result.status).toBe('submitted');
      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith({
        data: { applicationId: 1, userId: 10, fromStatus: 'draft', toStatus: 'submitted' },
      });
    });
    it('rejects submit from non-draft', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'submitted' });
      await expect(service.submit(1, 10)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('startVerification', () => {
    it('transitions submitted to under_review', async () => {
      const app = { id: 1, status: 'submitted' };
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue({ ...app, status: 'under_review' });
      const result = await service.startVerification(1, 10);
      expect(result.status).toBe('under_review');
    });
    it('rejects from draft', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft' });
      await expect(service.startVerification(1, 10)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('moveToReview', () => {
    it('transitions pending_documents to under_review', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'under_review' });
      const result = await service.moveToReview(1, 10);
      expect(result.status).toBe('under_review');
    });
    it('transitions submitted to under_review', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'under_review' });
      const result = await service.moveToReview(1, 10);
      expect(result.status).toBe('under_review');
    });
    it('rejects from draft', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft' });
      await expect(service.moveToReview(1, 10)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('requestDocuments', () => {
    it('transitions under_review to pending_documents', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'under_review' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'pending_documents' });
      const result = await service.requestDocuments(1, 10);
      expect(result.status).toBe('pending_documents');
    });
    it('transitions submitted to pending_documents', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'pending_documents' });
      const result = await service.requestDocuments(1, 10);
      expect(result.status).toBe('pending_documents');
    });
    it('rejects from draft', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft' });
      await expect(service.requestDocuments(1, 10)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('approve', () => {
    it('transitions under_review to approved with loan terms', async () => {
      const app = { id: 1, status: 'under_review', loanTerm: null, interestRate: null, monthlyPayment: null };
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue({ ...app, status: 'approved' });
      const result = await service.approve(1, 10, { loanTerm: 60, interestRate: 5.5, monthlyPayment: 450 });
      expect(result.status).toBe('approved');
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'approved', loanTerm: 60, interestRate: 5.5, monthlyPayment: 450 }),
      });
    });
    it('falls back to existing loan terms when not provided', async () => {
      const app = { id: 1, status: 'under_review', loanTerm: 36, interestRate: 4.5, monthlyPayment: 300 };
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue({ ...app, status: 'approved' });
      await service.approve(1, 10, {});
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ loanTerm: 36, interestRate: 4.5, monthlyPayment: 300 }),
      });
    });
    it('transitions pending_documents to approved', async () => {
      const app = { id: 1, status: 'pending_documents', loanTerm: 48, interestRate: 5.0, monthlyPayment: 400 };
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue({ ...app, status: 'approved' });
      const result = await service.approve(1, 10, { loanTerm: 60 });
      expect(result.status).toBe('approved');
    });
    it('rejects from draft', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft', loanTerm: null, interestRate: null, monthlyPayment: null });
      await expect(service.approve(1, 10, {})).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('reject', () => {
    it('transitions under_review to rejected with reason', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'under_review' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'rejected' });
      const result = await service.reject(1, 10, 'Insufficient income');
      expect(result.status).toBe('rejected');
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ rejectionReason: 'Insufficient income' }),
      });
    });
    it('transitions pending_documents to rejected', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'rejected' });
      const result = await service.reject(1, 10, 'Missing docs');
      expect(result.status).toBe('rejected');
    });
    it('rejects from draft', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft' });
      await expect(service.reject(1, 10, 'reason')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('sign', () => {
    it('signs an approved application', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'approved', signedAt: null });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'signed' });
      const result = await service.sign(1, 10, 'base64sig');
      expect(result.status).toBe('signed');
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ signatureData: 'base64sig', agreementAccepted: true }),
      });
    });
    it('rejects sign if not approved', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'draft', signedAt: null });
      await expect(service.sign(1, 10, 'sig')).rejects.toThrow(UnprocessableEntityException);
    });
    it('rejects sign if already signed', async () => {
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({ id: 1, status: 'approved', signedAt: new Date() });
      await expect(service.sign(1, 10, 'sig')).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
