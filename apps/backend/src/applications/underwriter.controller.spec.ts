// apps/backend/src/applications/underwriter.controller.spec.ts
import { UnderwriterController } from './underwriter.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { PrismaService } from '../prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('UnderwriterController', () => {
  let controller: UnderwriterController;
  const mockService = { findOne: jest.fn() };
  const mockWorkflow = {
    approve: jest.fn(),
    reject: jest.fn(),
    requestDocuments: jest.fn(),
  };
  const mockPrisma = {
    application: { findMany: jest.fn() },
    applicationNote: { create: jest.fn(), findMany: jest.fn() },
  };
  const uwReq = () => ({
    user: { sub: 3, email: 'uw@test.com', role: 'underwriter', jti: 'j' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new UnderwriterController(
      mockService as unknown as ApplicationsService,
      mockWorkflow as unknown as ApplicationWorkflowService,
      mockPrisma as unknown as PrismaService,
    );
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return applications for underwriter', async () => {
      const apps = [{ id: 1, status: 'under_review' }];
      mockPrisma.application.findMany.mockResolvedValue(apps);
      const result = await controller.findAll();
      expect(result).toEqual(apps);
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: { in: ['submitted', 'under_review', 'pending_documents'] } } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return application detail', async () => {
      mockService.findOne.mockResolvedValue({ id: 1 });
      const result = await controller.findOne(1, uwReq());
      expect(mockService.findOne).toHaveBeenCalledWith(1, 3, 'underwriter');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('approve', () => {
    it('should approve with loan terms', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      const result = await controller.approve(1, uwReq(), {
        loan_term: 60, interest_rate: 5.5, monthly_payment: 450,
      });
      expect(mockWorkflow.approve).toHaveBeenCalledWith(1, 3, { loanTerm: 60, interestRate: 5.5, monthlyPayment: 450 });
      expect(result.status).toBe('approved');
    });
    it('should save decision notes when provided', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      await controller.approve(1, uwReq(), {
        decision_notes: 'Good candidate', approval_conditions: 'Verify employment',
      });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          note: expect.stringContaining('Approved'),
          internal: true,
        }),
      });
    });
    it('should skip note when no decision_notes or conditions', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      await controller.approve(1, uwReq(), {});
      expect(mockPrisma.applicationNote.create).not.toHaveBeenCalled();
    });
    it('should save note with only decision_notes', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      await controller.approve(1, uwReq(), { decision_notes: 'Looks good' });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledTimes(1);
    });
    it('should save note with only approval_conditions', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      await controller.approve(1, uwReq(), { approval_conditions: 'Must verify income' });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('reject', () => {
    it('should reject with reason', async () => {
      mockWorkflow.reject.mockResolvedValue({ id: 1, status: 'rejected' });
      const result = await controller.reject(1, uwReq(), { rejection_reason: 'Insufficient income' });
      expect(mockWorkflow.reject).toHaveBeenCalledWith(1, 3, 'Insufficient income');
      expect(result.status).toBe('rejected');
    });
    it('should save decision notes when provided', async () => {
      mockWorkflow.reject.mockResolvedValue({ id: 1, status: 'rejected' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      await controller.reject(1, uwReq(), { decision_notes: 'Too risky' });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ note: expect.stringContaining('Rejected') }),
      });
    });
    it('should skip note when no decision_notes', async () => {
      mockWorkflow.reject.mockResolvedValue({ id: 1, status: 'rejected' });
      await controller.reject(1, uwReq(), {});
      expect(mockPrisma.applicationNote.create).not.toHaveBeenCalled();
    });
  });

  describe('requestDocuments', () => {
    it('should request documents and create note', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      const result = await controller.requestDocuments(1, uwReq(), {
        documents: ['bank_statement'], notes: 'Last 6 months',
      });
      expect(result.status).toBe('pending_documents');
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledTimes(1);
    });
    it('should create note with only notes param', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      await controller.requestDocuments(1, uwReq(), { notes: 'Need more info' });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledTimes(1);
    });
    it('should skip note when no docs or notes', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      const result = await controller.requestDocuments(1, uwReq(), {});
      expect(result.status).toBe('pending_documents');
      expect(mockPrisma.applicationNote.create).not.toHaveBeenCalled();
    });
  });

  describe('addNote', () => {
    it('should add a note with default internal=true', async () => {
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, note: 'UW note' });
      const result = await controller.addNote(1, uwReq(), { note: 'UW note' });
      expect(result.note).toBe('UW note');
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: { applicationId: 1, userId: 3, note: 'UW note', internal: true },
      });
    });
    it('should respect internal=false', async () => {
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1 });
      await controller.addNote(1, uwReq(), { note: 'Public', internal: false });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ internal: false }),
      });
    });
  });

  describe('getNotes', () => {
    it('should return notes with user info', async () => {
      const notes = [{ id: 1, note: 'Note', user: { id: 3 } }];
      mockPrisma.applicationNote.findMany.mockResolvedValue(notes);
      const result = await controller.getNotes(1);
      expect(result).toEqual(notes);
      expect(mockPrisma.applicationNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { user: true } }),
      );
    });
  });
});
