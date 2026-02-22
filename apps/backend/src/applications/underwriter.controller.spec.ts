// apps/backend/src/applications/underwriter.controller.spec.ts
import { UnderwriterController } from './underwriter.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { PrismaService } from '../prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('UnderwriterController', () => {
  let controller: UnderwriterController;
  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const mockWorkflow = {
    approve: jest.fn(),
    reject: jest.fn(),
    requestDocuments: jest.fn(),
  };
  const mockPrisma = {
    application: { findMany: jest.fn() },
    applicationNote: { create: jest.fn(), findMany: jest.fn() },
  };

  const staffReq = () => ({
    user: { sub: 2, email: 's@test.com', role: 'underwriter', scopes: [], jti: 'j' } as JwtPayload,
  });

  const fullApp = {
    id: 1, applicationNumber: 'AL-2026-00001', status: 'submitted', currentStep: 1,
    loanTerm: 60, interestRate: null, monthlyPayment: null, loanAmount: 25000, downPayment: 5000,
    dob: null, submittedAt: new Date(), decidedAt: null, signatureData: null, signedAt: null,
    agreementAccepted: null, ssnEncrypted: null, userId: 1, createdAt: new Date(), updatedAt: new Date(),
    user: { firstName: 'John', lastName: 'Doe', email: 'j@test.com', phone: null },
    addresses: [], vehicles: [], financialInfos: [], documents: [], statusHistories: [],
  };

  beforeEach(() => {
    controller = new UnderwriterController(
      mockService as unknown as ApplicationsService,
      mockWorkflow as unknown as ApplicationWorkflowService,
      mockPrisma as unknown as PrismaService,
    );
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return serialized applications with default statuses', async () => {
      mockService.findAll.mockResolvedValue({
        data: [fullApp],
        pagination: { page: 1, per_page: 25, total: 1, total_pages: 1 },
      });
      const result = await controller.findAll(staffReq());
      expect(result.data).toHaveLength(1);
      expect(result.data[0].personal_info).toBeDefined();
      expect(result.pagination.total).toBe(1);
    });

    it('should pass query params including OData filters', async () => {
      mockService.findAll.mockResolvedValue({ data: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 } });
      await controller.findAll(staffReq(), "status eq 'under_review'", 'created_at desc', 'under_review', '1', '10');
      expect(mockService.findAll).toHaveBeenCalledWith(expect.objectContaining({
        $filter: "status eq 'under_review'",
        $orderby: 'created_at desc',
        status: 'under_review',
        page: 1,
        per_page: 10,
      }));
    });
  });

  describe('findOne', () => {
    it('should return serialized application', async () => {
      mockService.findOne.mockResolvedValue(fullApp);
      const result = await controller.findOne(1, staffReq());
      expect(result.personal_info).toBeDefined();
      expect(result.personal_info.first_name).toBe('John');
    });
  });

  describe('approve', () => {
    it('should approve with terms and notes', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      const result = await controller.approve(1, staffReq(), {
        loan_term: 48, interest_rate: 5.5, monthly_payment: 450,
        decision_notes: 'Good credit', approval_conditions: 'Verify income',
      });
      expect(result.status).toBe('approved');
      expect(mockPrisma.applicationNote.create).toHaveBeenCalled();
    });

    it('should approve without notes', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      await controller.approve(1, staffReq(), { loan_term: 48 });
      expect(mockPrisma.applicationNote.create).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject with notes', async () => {
      mockWorkflow.reject.mockResolvedValue({ id: 1, status: 'rejected' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      const result = await controller.reject(1, staffReq(), {
        rejection_reason: 'Bad credit', decision_notes: 'Score too low',
      });
      expect(result.status).toBe('rejected');
      expect(mockPrisma.applicationNote.create).toHaveBeenCalled();
    });

    it('should reject without notes', async () => {
      mockWorkflow.reject.mockResolvedValue({ id: 1, status: 'rejected' });
      await controller.reject(1, staffReq(), { rejection_reason: 'Bad credit' });
      expect(mockPrisma.applicationNote.create).not.toHaveBeenCalled();
    });
  });

  describe('requestDocuments', () => {
    it('should request documents with note (hyphenated)', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      const result = await controller.requestDocuments(1, staffReq(), {
        documents: ['pay_stub', 'bank_statement'], notes: 'Last 3 months',
      });
      expect(result.status).toBe('pending_documents');
      expect(mockPrisma.applicationNote.create).toHaveBeenCalled();
    });

    it('should request documents (underscore alias)', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      mockPrisma.applicationNote.create.mockResolvedValue({});
      await controller.requestDocumentsUnderscore(1, staffReq(), { documents: ['tax_return'] });
      expect(mockWorkflow.requestDocuments).toHaveBeenCalledWith(1, 2);
    });

    it('should skip note when no documents or notes', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      await controller.requestDocuments(1, staffReq(), {});
      expect(mockPrisma.applicationNote.create).not.toHaveBeenCalled();
    });
  });

  describe('addNote', () => {
    it('should add note (hyphenated)', async () => {
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, note: 'Test' });
      const result = await controller.addNote(1, staffReq(), { note: 'Test', internal: true });
      expect(result.note).toBe('Test');
    });

    it('should add note (underscore alias)', async () => {
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, note: 'Test2' });
      const result = await controller.addNoteUnderscore(1, staffReq(), { note: 'Test2' });
      expect(result.note).toBe('Test2');
    });

    it('should default internal to true', async () => {
      mockPrisma.applicationNote.create.mockResolvedValue({});
      await controller.addNote(1, staffReq(), { note: 'X' });
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ internal: true }),
      });
    });
  });

  describe('getNotes', () => {
    it('should return notes for application', async () => {
      mockPrisma.applicationNote.findMany.mockResolvedValue([{ id: 1, note: 'Hi' }]);
      const result = await controller.getNotes(1);
      expect(result).toHaveLength(1);
    });
  });
});
