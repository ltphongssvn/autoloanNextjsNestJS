// apps/backend/src/applications/loan-officer.controller.spec.ts
import { LoanOfficerController } from './loan-officer.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { PrismaService } from '../prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('LoanOfficerController', () => {
  let controller: LoanOfficerController;
  const mockService = { findOne: jest.fn() };
  const mockWorkflow = {
    startVerification: jest.fn(),
    moveToReview: jest.fn(),
    requestDocuments: jest.fn(),
  };
  const mockPrisma = {
    application: { findMany: jest.fn() },
    document: { create: jest.fn() },
    applicationNote: { create: jest.fn(), findMany: jest.fn() },
  };
  const staffReq = () => ({
    user: { sub: 2, email: 'lo@test.com', role: 'loan_officer', jti: 'j' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new LoanOfficerController(
      mockService as unknown as ApplicationsService,
      mockWorkflow as unknown as ApplicationWorkflowService,
      mockPrisma as unknown as PrismaService,
    );
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return applications for loan officer', async () => {
      const apps = [{ id: 1, status: 'submitted' }];
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
      const result = await controller.findOne(1, staffReq());
      expect(mockService.findOne).toHaveBeenCalledWith(1, 2, 'loan_officer');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('startVerification', () => {
    it('should start verification', async () => {
      mockWorkflow.startVerification.mockResolvedValue({ id: 1, status: 'under_review' });
      const result = await controller.startVerification(1, staffReq());
      expect(mockWorkflow.startVerification).toHaveBeenCalledWith(1, 2);
      expect(result.status).toBe('under_review');
    });
  });

  describe('review', () => {
    it('should move to review', async () => {
      mockWorkflow.moveToReview.mockResolvedValue({ id: 1, status: 'under_review' });
      const result = await controller.review(1, staffReq());
      expect(mockWorkflow.moveToReview).toHaveBeenCalledWith(1, 2);
      expect(result.status).toBe('under_review');
    });
  });

  describe('requestDocuments', () => {
    it('should request documents with document_requests', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.document.create.mockResolvedValue({});
      mockPrisma.applicationNote.create.mockResolvedValue({});
      const result = await controller.requestDocuments(1, staffReq(), {
        document_requests: [{ doc_type: 'pay_stub', note: 'Last 3 months' }],
        notes: 'Please upload ASAP',
      });
      expect(result.status).toBe('pending_documents');
      expect(mockPrisma.document.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledTimes(1);
    });
    it('should request documents with documents array', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.document.create.mockResolvedValue({});
      mockPrisma.applicationNote.create.mockResolvedValue({});
      const result = await controller.requestDocuments(1, staffReq(), {
        documents: ['bank_statement', 'tax_return'],
        notes: 'Need these',
      });
      expect(result.status).toBe('pending_documents');
      expect(mockPrisma.document.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledTimes(1);
    });
    it('should skip note creation when no docs or notes', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      const result = await controller.requestDocuments(1, staffReq(), {});
      expect(result.status).toBe('pending_documents');
      expect(mockPrisma.applicationNote.create).not.toHaveBeenCalled();
    });
  });

  describe('addNote', () => {
    it('should add a note with default internal=true', async () => {
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, note: 'Test note' });
      const result = await controller.addNote(1, staffReq(), { note: 'Test note' });
      expect(result.note).toBe('Test note');
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: { applicationId: 1, userId: 2, note: 'Test note', internal: true },
      });
    });
    it('should respect internal=false flag', async () => {
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, note: 'Public', internal: false });
      await controller.addNote(1, staffReq(), { note: 'Public', internal: false });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ internal: false }),
      });
    });
  });

  describe('getNotes', () => {
    it('should return notes for application', async () => {
      const notes = [{ id: 1, note: 'Note 1' }];
      mockPrisma.applicationNote.findMany.mockResolvedValue(notes);
      const result = await controller.getNotes(1);
      expect(result).toEqual(notes);
    });
  });
});
