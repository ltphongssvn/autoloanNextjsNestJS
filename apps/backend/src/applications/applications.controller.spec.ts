// apps/backend/src/applications/applications.controller.spec.ts
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { StatusHistoryService } from './status-history.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { AgreementPdfService } from './agreement-pdf.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
  };
  const mockHistory = { findByApplication: jest.fn() };
  const mockWorkflow = { submit: jest.fn(), sign: jest.fn() };
  const mockPdf = { generate: jest.fn() };

  const customerReq = () => ({
    user: { sub: 1, email: 'c@test.com', role: 'customer', scopes: [], jti: 'j' } as JwtPayload,
  });
  const staffReq = () => ({
    user: { sub: 2, email: 's@test.com', role: 'loan_officer', scopes: [], jti: 'j' } as JwtPayload,
  });

  const fullApp = {
    id: 1, applicationNumber: 'AL-2026-00001', status: 'draft', currentStep: 1,
    loanTerm: 60, interestRate: 5.5, monthlyPayment: 450, loanAmount: 25000, downPayment: 5000,
    dob: new Date('1990-01-01'), submittedAt: null, decidedAt: null, signatureData: null,
    signedAt: null, agreementAccepted: null, ssnEncrypted: '123-45-6789', userId: 1,
    createdAt: new Date(), updatedAt: new Date(),
    user: { firstName: 'John', lastName: 'Doe', email: 'j@test.com', phone: '555-1234' },
    addresses: [{ addressType: 'residential', streetAddress: '123 Main', city: 'X', state: 'IL', zipCode: '62701', yearsAtAddress: 3, monthsAtAddress: 0 }],
    vehicles: [{ make: 'Toyota', model: 'Camry', year: 2023, vin: 'V1', trim: 'SE', condition: 'new', estimatedValue: 28000, mileage: 15 }],
    financialInfos: [{ incomeType: 'primary', employerName: 'Acme', jobTitle: 'Eng', employmentStatus: 'full_time', yearsEmployed: 5, monthsEmployed: 0, annualIncome: 120000, monthlyExpenses: 3000, creditScore: 750, otherIncome: null }],
    documents: [], statusHistories: [],
  };

  beforeEach(() => {
    controller = new ApplicationsController(
      mockService as unknown as ApplicationsService,
      mockHistory as unknown as StatusHistoryService,
      mockWorkflow as unknown as ApplicationWorkflowService,
      mockPdf as unknown as AgreementPdfService,
    );
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call findAllForUser for customers', async () => {
      mockService.findAllForUser.mockResolvedValue({ data: [], pagination: {} });
      await controller.findAll(customerReq());
      expect(mockService.findAllForUser).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should call findAll for staff', async () => {
      mockService.findAll.mockResolvedValue({ data: [], pagination: {} });
      await controller.findAll(staffReq());
      expect(mockService.findAll).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should pass query params', async () => {
      mockService.findAll.mockResolvedValue({ data: [], pagination: {} });
      await controller.findAll(staffReq(), "status eq 'draft'", 'created_at desc', 'submitted', '2', '10');
      expect(mockService.findAll).toHaveBeenCalledWith({
        $filter: "status eq 'draft'",
        $orderby: 'created_at desc',
        status: 'submitted',
        page: 2,
        per_page: 10,
      });
    });

    it('should handle undefined query params', async () => {
      mockService.findAllForUser.mockResolvedValue({ data: [], pagination: {} });
      await controller.findAll(customerReq(), undefined, undefined, undefined, undefined, undefined);
      expect(mockService.findAllForUser).toHaveBeenCalledWith(1, {
        $filter: undefined,
        $orderby: undefined,
        status: undefined,
        page: undefined,
        per_page: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('should return serialized application with virtual attributes', async () => {
      mockService.findOne.mockResolvedValue(fullApp);
      const result = await controller.findOne(1, customerReq());
      expect(mockService.findOne).toHaveBeenCalledWith(1, 1, 'customer');
      expect(result.personal_info).toBeDefined();
      expect(result.personal_info.first_name).toBe('John');
      expect(result.personal_info.ssn).toBe('123-45-6789');
      expect(result.car_details.make).toBe('Toyota');
      expect(result.loan_details.amount).toBe('25000');
      expect(result.employment_info.employer).toBe('Acme');
      expect(result.links).toBeDefined();
      expect(result.links.submit).toBeDefined();
    });

    it('should hide SSN from non-owner', async () => {
      mockService.findOne.mockResolvedValue({ ...fullApp, userId: 99 });
      const result = await controller.findOne(1, customerReq());
      expect(result.personal_info.ssn).toBeNull();
    });
  });

  describe('create', () => {
    it('should create application', async () => {
      mockService.create.mockResolvedValue({ id: 1 });
      const result = await controller.create(customerReq(), { loanAmount: 25000 });
      expect(mockService.create).toHaveBeenCalledWith(1, { loanAmount: 25000 });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should update application', async () => {
      mockService.update.mockResolvedValue({ id: 1 });
      await controller.update(1, customerReq(), { loanAmount: 30000 });
      expect(mockService.update).toHaveBeenCalledWith(1, 1, { loanAmount: 30000 });
    });
  });

  describe('remove', () => {
    it('should delete application', async () => {
      mockService.remove.mockResolvedValue({ message: 'deleted' });
      await controller.remove(1, customerReq());
      expect(mockService.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('submit', () => {
    it('should submit application', async () => {
      mockWorkflow.submit.mockResolvedValue({ id: 1, status: 'submitted' });
      await controller.submit(1, customerReq());
      expect(mockWorkflow.submit).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('sign', () => {
    it('should sign application', async () => {
      mockWorkflow.sign.mockResolvedValue({ id: 1 });
      await controller.sign(1, customerReq(), { signature_data: 'sig' });
      expect(mockWorkflow.sign).toHaveBeenCalledWith(1, 1, 'sig');
    });
  });

  describe('agreementPdf', () => {
    it('should return PDF', async () => {
      mockPdf.generate.mockResolvedValue({ buffer: Buffer.from('pdf'), filename: 'test.pdf' });
      const res = { set: jest.fn(), send: jest.fn() };
      await controller.agreementPdf(1, customerReq(), res as any);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return history', async () => {
      mockHistory.findByApplication.mockResolvedValue([]);
      await controller.getHistory(1);
      expect(mockHistory.findByApplication).toHaveBeenCalledWith(1);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      mockService.updateStatus.mockResolvedValue({ id: 1, status: 'approved' });
      await controller.updateStatus(1, staffReq(), { status: 'approved' });
      expect(mockService.updateStatus).toHaveBeenCalledWith(1, 'approved', 2);
    });
  });
});
