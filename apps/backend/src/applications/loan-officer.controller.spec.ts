// apps/backend/src/applications/loan-officer.controller.spec.ts
import { LoanOfficerController } from './loan-officer.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('LoanOfficerController', () => {
  let controller: LoanOfficerController;
  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const mockWorkflow = {
    startVerification: jest.fn(),
    moveToReview: jest.fn(),
    requestDocuments: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };

  const staffReq = () => ({
    user: { sub: 2, email: 's@test.com', role: 'loan_officer', scopes: [], jti: 'j' } as JwtPayload,
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
    controller = new LoanOfficerController(
      mockService as unknown as ApplicationsService,
      mockWorkflow as unknown as ApplicationWorkflowService,
    );
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return serialized applications', async () => {
      mockService.findAll.mockResolvedValue({ data: [fullApp], pagination: { page: 1, per_page: 25, total: 1, total_pages: 1 } });
      const result = await controller.findAll(staffReq());
      expect(result.data).toHaveLength(1);
      expect(result.data[0].personal_info).toBeDefined();
      expect(result.pagination.total).toBe(1);
    });

    it('should pass query params', async () => {
      mockService.findAll.mockResolvedValue({ data: [], pagination: { page: 2, per_page: 10, total: 0, total_pages: 0 } });
      await controller.findAll(staffReq(), "status eq 'submitted'", 'created_at desc', 'submitted', '2', '10');
      expect(mockService.findAll).toHaveBeenCalledWith({
        $filter: "status eq 'submitted'",
        $orderby: 'created_at desc',
        status: 'submitted',
        page: 2,
        per_page: 10,
      });
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

  describe('startVerification', () => {
    it('should call workflow via PATCH', async () => {
      mockWorkflow.startVerification.mockResolvedValue({ id: 1, status: 'under_review' });
      const result = await controller.startVerification(1, staffReq());
      expect(mockWorkflow.startVerification).toHaveBeenCalledWith(1, 2);
      expect(result.status).toBe('under_review');
    });

    it('should call workflow via POST (Rails-compatible)', async () => {
      mockWorkflow.startVerification.mockResolvedValue({ id: 1, status: 'under_review' });
      const result = await controller.startVerificationPost(1, staffReq());
      expect(mockWorkflow.startVerification).toHaveBeenCalledWith(1, 2);
      expect(result.status).toBe('under_review');
    });
  });

  describe('moveToReview', () => {
    it('should call workflow moveToReview', async () => {
      mockWorkflow.moveToReview.mockResolvedValue({ id: 1, status: 'under_review' });
      const result = await controller.moveToReview(1, staffReq());
      expect(mockWorkflow.moveToReview).toHaveBeenCalledWith(1, 2);
      expect(result.status).toBe('under_review');
    });
  });

  describe('requestDocuments', () => {
    it('should call workflow via PATCH', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      const result = await controller.requestDocuments(1, staffReq());
      expect(mockWorkflow.requestDocuments).toHaveBeenCalledWith(1, 2);
      expect(result.status).toBe('pending_documents');
    });

    it('should call workflow via POST (Rails-compatible)', async () => {
      mockWorkflow.requestDocuments.mockResolvedValue({ id: 1, status: 'pending_documents' });
      const result = await controller.requestDocumentsPost(1, staffReq());
      expect(mockWorkflow.requestDocuments).toHaveBeenCalledWith(1, 2);
      expect(result.status).toBe('pending_documents');
    });
  });

  describe('approve', () => {
    it('should call workflow via PATCH with terms', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      const result = await controller.approve(1, staffReq(), { loan_term: 48, interest_rate: 5.5, monthly_payment: 450 });
      expect(mockWorkflow.approve).toHaveBeenCalledWith(1, 2, { loanTerm: 48, interestRate: 5.5, monthlyPayment: 450 });
      expect(result.status).toBe('approved');
    });

    it('should call workflow via POST (Rails-compatible)', async () => {
      mockWorkflow.approve.mockResolvedValue({ id: 1, status: 'approved' });
      const result = await controller.approvePost(1, staffReq(), { loan_term: 60, interest_rate: 4.9, monthly_payment: 400 });
      expect(mockWorkflow.approve).toHaveBeenCalledWith(1, 2, { loanTerm: 60, interestRate: 4.9, monthlyPayment: 400 });
      expect(result.status).toBe('approved');
    });
  });

  describe('reject', () => {
    it('should call workflow via PATCH with reason', async () => {
      mockWorkflow.reject.mockResolvedValue({ id: 1, status: 'rejected' });
      const result = await controller.reject(1, staffReq(), { reason: 'Insufficient income' });
      expect(mockWorkflow.reject).toHaveBeenCalledWith(1, 2, 'Insufficient income');
      expect(result.status).toBe('rejected');
    });

    it('should call workflow via POST (Rails-compatible)', async () => {
      mockWorkflow.reject.mockResolvedValue({ id: 1, status: 'rejected' });
      const result = await controller.rejectPost(1, staffReq(), { reason: 'Bad credit' });
      expect(mockWorkflow.reject).toHaveBeenCalledWith(1, 2, 'Bad credit');
      expect(result.status).toBe('rejected');
    });
  });

  describe('addNote', () => {
    it('should add note via POST (Rails-compatible)', async () => {
      const result = await controller.addNote(1, staffReq(), { note: 'Test note' });
      expect(result.message).toBe('Note added');
      expect(result.applicationId).toBe(1);
    });
  });
});
