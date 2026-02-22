// apps/backend/src/applications/applications.service.spec.ts
import { NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  const mockTx = {
    application: { create: jest.fn(), update: jest.fn() },
    address: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    vehicle: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    financialInfo: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };
  const mockPrisma = {
    application: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    address: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    vehicle: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    financialInfo: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    statusHistory: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(mockTx)),
  };
  const mockNotifications = {
    notifyStatusChange: jest.fn().mockResolvedValue(true),
    notifyApplicationApproved: jest.fn().mockResolvedValue(true),
    notifyApplicationRejected: jest.fn().mockResolvedValue(true),
    notifyApplicationSubmitted: jest.fn().mockResolvedValue(true),
    notifyDocumentUploaded: jest.fn().mockResolvedValue(true),
    sendEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    service = new ApplicationsService(
      mockPrisma as unknown as PrismaService,
      mockNotifications as unknown as NotificationsService,
    );
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockTx));
  });

  describe('create', () => {
    it('should create application with generated number', async () => {
      mockPrisma.application.count.mockResolvedValue(2);
      const year = new Date().getFullYear();
      mockTx.application.create.mockResolvedValue({ id: 1, applicationNumber: `AL-${year}-00003` });
      const result = await service.create(1, { loanAmount: 25000 });
      expect(result.applicationNumber).toBe(`AL-${year}-00003`);
    });

    it('should save nested personal_info with address', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      mockTx.address.create.mockResolvedValue({});
      await service.create(1, {
        personal_info: { dob: '1990-01-15', ssn: '123-45-6789', address: '123 Main St', city: 'Springfield', state: 'IL', zip: '62701', years_at_address: 3, months_at_address: 6 },
      });
      expect(mockTx.application.create).toHaveBeenCalledWith({ data: expect.objectContaining({ dob: new Date('1990-01-15'), ssnEncrypted: '123-45-6789' }) });
      expect(mockTx.address.create).toHaveBeenCalledWith({ data: expect.objectContaining({ addressType: 'residential', streetAddress: '123 Main St' }) });
    });

    it('should save nested car_details as vehicle', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      mockTx.vehicle.create.mockResolvedValue({});
      await service.create(1, { car_details: { make: 'Toyota', model: 'Camry', year: 2023, condition: 'new', price: 28000 } });
      expect(mockTx.vehicle.create).toHaveBeenCalledWith({ data: expect.objectContaining({ make: 'Toyota', condition: 'new' }) });
    });

    it('should normalize used_certified condition', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      mockTx.vehicle.create.mockResolvedValue({});
      await service.create(1, { car_details: { make: 'Honda', condition: 'used_certified' } });
      expect(mockTx.vehicle.create).toHaveBeenCalledWith({ data: expect.objectContaining({ condition: 'certified' }) });
    });

    it('should set invalid condition to undefined', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      mockTx.vehicle.create.mockResolvedValue({});
      await service.create(1, { car_details: { make: 'Honda', condition: 'junk' } });
      expect(mockTx.vehicle.create).toHaveBeenCalledWith({ data: expect.objectContaining({ condition: undefined }) });
    });

    it('should save employment_info as financial_info', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      mockTx.financialInfo.create.mockResolvedValue({});
      await service.create(1, { employment_info: { employer: 'Acme', income: 120000, credit_score: 750 } });
      expect(mockTx.financialInfo.create).toHaveBeenCalledWith({ data: expect.objectContaining({ incomeType: 'primary', annualIncome: 120000, monthlyIncome: 10000, creditScore: 750 }) });
    });

    it('should save nested loan_details', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      await service.create(1, { loan_details: { amount: 30000, down_payment: 5000 } });
      expect(mockTx.application.create).toHaveBeenCalledWith({ data: expect.objectContaining({ loanAmount: 30000, downPayment: 5000 }) });
    });

    it('should unwrap { application: { ... } } wrapper', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      await service.create(1, { application: { loan_details: { amount: 20000 }, current_step: 3 } } as any);
      expect(mockTx.application.create).toHaveBeenCalledWith({ data: expect.objectContaining({ loanAmount: 20000, currentStep: 3 }) });
    });

    it('should skip address when no address field', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      await service.create(1, { personal_info: { dob: '1990-01-01' } });
      expect(mockTx.address.create).not.toHaveBeenCalled();
    });

    it('should skip vehicle when no make', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      await service.create(1, { car_details: { year: 2023 } });
      expect(mockTx.vehicle.create).not.toHaveBeenCalled();
    });

    it('should handle credit_score 0 as undefined', async () => {
      mockPrisma.application.count.mockResolvedValue(0);
      mockTx.application.create.mockResolvedValue({ id: 1 });
      mockTx.financialInfo.create.mockResolvedValue({});
      await service.create(1, { employment_info: { employer: 'X', credit_score: 0 } });
      expect(mockTx.financialInfo.create).toHaveBeenCalledWith({ data: expect.objectContaining({ creditScore: undefined }) });
    });
  });

  describe('findAllForUser', () => {
    it('should return paginated results with default params', async () => {
      const apps = [{ id: 1 }, { id: 2 }];
      mockPrisma.application.findMany.mockResolvedValue(apps);
      mockPrisma.application.count.mockResolvedValue(2);
      const result = await service.findAllForUser(1);
      expect(result.data).toEqual(apps);
      expect(result.pagination).toEqual({ page: 1, per_page: 25, total: 2, total_pages: 1 });
    });

    it('should filter by status query param', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { status: 'draft' });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, status: 'draft' } }),
      );
    });

    it('should apply OData $filter', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $filter: "status eq 'submitted' and loan_term gt 36" });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, status: 'submitted', loanTerm: { gt: 36 } } }),
      );
    });

    it('should apply OData $orderby', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $orderby: 'created_at asc' });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ createdAt: 'asc' }] }),
      );
    });

    it('should apply pagination', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(50);
      const result = await service.findAllForUser(1, { page: 2, per_page: 10 });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.pagination).toEqual({ page: 2, per_page: 10, total: 50, total_pages: 5 });
    });

    it('should cap per_page at 100', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { per_page: 500 });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should ignore disallowed filter fields', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $filter: "email eq 'hack@test.com'" });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1 } }),
      );
    });

    it('should handle contains filter', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $filter: "contains(status, 'review')" });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, status: { contains: 'review', mode: 'insensitive' } } }),
      );
    });

    it('should handle multiple $orderby fields', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $orderby: 'status asc, created_at desc' });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] }),
      );
    });

    it('should parse boolean filter values', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $filter: "current_step eq 3" });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, currentStep: 3 } }),
      );
    });

    it('should handle ne operator', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $filter: "status ne 'rejected'" });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, status: { not: 'rejected' } } }),
      );
    });

    it('should handle ge and le operators', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $filter: "current_step ge 2 and current_step le 5" });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, currentStep: { lte: 5 } } }),
      );
    });

    it('should handle lt operator', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAllForUser(1, { $filter: "loan_term lt 60" });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1, loanTerm: { lt: 60 } } }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results for staff', async () => {
      mockPrisma.application.findMany.mockResolvedValue([{ id: 1, user: {} }]);
      mockPrisma.application.count.mockResolvedValue(1);
      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply filters for staff', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);
      await service.findAll({ status: 'submitted', $orderby: 'loan_amount desc' });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'submitted' }, orderBy: [{ loanAmount: 'desc' }] }),
      );
    });
  });

  describe('update', () => {
    const draftApp = { id: 1, userId: 1, status: 'draft', loanAmount: 20000, downPayment: 5000, loanTerm: 60, dob: null, currentStep: 1, ssnEncrypted: null };

    it('should update with nested personal_info and create address', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(draftApp);
      mockTx.application.update.mockResolvedValue({ ...draftApp });
      mockTx.address.findFirst.mockResolvedValue(null);
      mockTx.address.create.mockResolvedValue({});
      await service.update(1, 1, { personal_info: { address: '456 Oak Ave', city: 'Boston', state: 'MA', zip: '02101' } });
      expect(mockTx.address.create).toHaveBeenCalledWith({ data: expect.objectContaining({ streetAddress: '456 Oak Ave' }) });
    });

    it('should update existing address', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(draftApp);
      mockTx.application.update.mockResolvedValue({ ...draftApp });
      mockTx.address.findFirst.mockResolvedValue({ id: 10 });
      mockTx.address.update.mockResolvedValue({});
      await service.update(1, 1, { personal_info: { address: '789 Elm St', city: 'LA', state: 'CA', zip: '90001' } });
      expect(mockTx.address.update).toHaveBeenCalledWith({ where: { id: 10 }, data: expect.objectContaining({ streetAddress: '789 Elm St' }) });
    });

    it('should create vehicle when none exists', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(draftApp);
      mockTx.application.update.mockResolvedValue({ ...draftApp });
      mockTx.vehicle.findUnique.mockResolvedValue(null);
      mockTx.vehicle.create.mockResolvedValue({});
      await service.update(1, 1, { car_details: { make: 'Ford', model: 'F-150', year: 2024 } });
      expect(mockTx.vehicle.create).toHaveBeenCalledWith({ data: expect.objectContaining({ make: 'Ford', applicationId: 1 }) });
    });

    it('should update existing vehicle', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(draftApp);
      mockTx.application.update.mockResolvedValue({ ...draftApp });
      mockTx.vehicle.findUnique.mockResolvedValue({ id: 5 });
      mockTx.vehicle.update.mockResolvedValue({});
      await service.update(1, 1, { car_details: { make: 'Ford', model: 'Mustang' } });
      expect(mockTx.vehicle.update).toHaveBeenCalledWith({ where: { id: 5 }, data: expect.objectContaining({ make: 'Ford' }) });
    });

    it('should create financial_info when none exists', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(draftApp);
      mockTx.application.update.mockResolvedValue({ ...draftApp });
      mockTx.financialInfo.findFirst.mockResolvedValue(null);
      mockTx.financialInfo.create.mockResolvedValue({});
      await service.update(1, 1, { employment_info: { employer: 'NewCo', income: 80000 } });
      expect(mockTx.financialInfo.create).toHaveBeenCalledWith({ data: expect.objectContaining({ employerName: 'NewCo', applicationId: 1 }) });
    });

    it('should update existing financial_info', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(draftApp);
      mockTx.application.update.mockResolvedValue({ ...draftApp });
      mockTx.financialInfo.findFirst.mockResolvedValue({ id: 7 });
      mockTx.financialInfo.update.mockResolvedValue({});
      await service.update(1, 1, { employment_info: { employer: 'UpdatedCo' } });
      expect(mockTx.financialInfo.update).toHaveBeenCalledWith({ where: { id: 7 }, data: expect.objectContaining({ employerName: 'UpdatedCo' }) });
    });

    it('should use existing values when dto fields undefined', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(draftApp);
      mockTx.application.update.mockResolvedValue(draftApp);
      await service.update(1, 1, {});
      expect(mockTx.application.update).toHaveBeenCalledWith({ where: { id: 1 }, data: expect.objectContaining({ loanAmount: 20000, downPayment: 5000, loanTerm: 60 }) });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.update(99, 1, { loanAmount: 30000 })).rejects.toThrow(NotFoundException);
    });
    it('should throw ForbiddenException when not owner', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 2, status: 'draft' });
      await expect(service.update(1, 1, { loanAmount: 30000 })).rejects.toThrow(ForbiddenException);
    });
    it('should throw UnprocessableEntityException when not draft', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 1, status: 'submitted' });
      await expect(service.update(1, 1, { loanAmount: 30000 })).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('findOne', () => {
    it('should return application by id', async () => {
      const app = { id: 1, userId: 1 };
      mockPrisma.application.findUnique.mockResolvedValue(app);
      expect(await service.findOne(1)).toEqual(app);
    });
    it('should throw NotFoundException when not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
    it('should throw ForbiddenException when customer accesses others app', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 2 });
      await expect(service.findOne(1, 1, 'customer')).rejects.toThrow(ForbiddenException);
    });
    it('should allow staff to access any app', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 2 });
      expect(await service.findOne(1, 1, 'loan_officer')).toEqual({ id: 1, userId: 2 });
    });
  });

  describe('remove', () => {
    it('should delete a draft application', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 1, status: 'draft' });
      mockPrisma.application.delete.mockResolvedValue({});
      expect(await service.remove(1, 1)).toEqual({ message: 'Application deleted' });
    });
    it('should throw NotFoundException', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.remove(99, 1)).rejects.toThrow(NotFoundException);
    });
    it('should throw ForbiddenException', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 2, status: 'draft' });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
    it('should throw UnprocessableEntityException', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 1, status: 'submitted' });
      await expect(service.remove(1, 1)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and notify', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'draft', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });
      const result = await service.updateStatus(1, 'submitted' as any, 1);
      expect(result.status).toBe('submitted');
    });
    it('should notify approved', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'under_review', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'approved' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });
      await service.updateStatus(1, 'approved' as any, 1);
      expect(mockNotifications.notifyApplicationApproved).toHaveBeenCalled();
    });
    it('should notify rejected', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'under_review', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'rejected' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });
      await service.updateStatus(1, 'rejected' as any, 1);
      expect(mockNotifications.notifyApplicationRejected).toHaveBeenCalled();
    });
    it('should skip notification if no user', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'draft', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await service.updateStatus(1, 'submitted' as any, 1);
      expect(mockNotifications.notifyStatusChange).not.toHaveBeenCalled();
    });
    it('should skip notification if no email', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'draft', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: null });
      await service.updateStatus(1, 'submitted' as any, 1);
      expect(mockNotifications.notifyStatusChange).not.toHaveBeenCalled();
    });
    it('should throw NotFoundException', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(99, 'submitted' as any, 1)).rejects.toThrow(NotFoundException);
    });
  });
});

import { applyOdataSelect } from './applications.service';

describe('applyOdataSelect', () => {
  const items = [
    { id: 1, status: 'draft', loan_amount: 25000, created_at: '2026-01-01', extra_field: 'x' },
    { id: 2, status: 'submitted', loan_amount: 30000, created_at: '2026-02-01', extra_field: 'y' },
  ];

  it('should return all data when no $select', () => {
    expect(applyOdataSelect(items)).toEqual(items);
    expect(applyOdataSelect(items, undefined)).toEqual(items);
  });

  it('should filter to selected fields', () => {
    const result = applyOdataSelect(items, 'status,loan_amount');
    expect(result[0]).toEqual({ id: 1, status: 'draft', loan_amount: 25000 });
    expect(result[1]).toEqual({ id: 2, status: 'submitted', loan_amount: 30000 });
  });

  it('should always include id', () => {
    const result = applyOdataSelect(items, 'status');
    expect(result[0]).toEqual({ id: 1, status: 'draft' });
  });

  it('should ignore disallowed fields', () => {
    const result = applyOdataSelect(items, 'status,extra_field');
    expect(result[0]).toEqual({ id: 1, status: 'draft' });
    expect(result[0]).not.toHaveProperty('extra_field');
  });

  it('should return all data when all fields invalid', () => {
    const result = applyOdataSelect(items, 'bogus,fake');
    expect(result).toEqual(items);
  });

  it('should handle empty string', () => {
    const result = applyOdataSelect(items, '');
    expect(result).toEqual(items);
  });
});
