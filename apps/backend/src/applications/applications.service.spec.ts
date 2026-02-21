// apps/backend/src/applications/applications.service.spec.ts
import { NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  const mockPrisma = {
    application: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    statusHistory: { create: jest.fn() },
    user: { findUnique: jest.fn() },
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
  });

  describe('create', () => {
    it('should create an application with generated number', async () => {
      mockPrisma.application.count.mockResolvedValue(2);
      mockPrisma.application.create.mockResolvedValue({ id: 1, applicationNumber: 'AL-000003' });
      const result = await service.create(1, { loanAmount: 25000 });
      expect(result.applicationNumber).toBe('AL-000003');
      expect(mockPrisma.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 1, applicationNumber: 'AL-000003' }),
      });
    });
  });

  describe('findAllForUser', () => {
    it('should return applications for a user', async () => {
      const apps = [{ id: 1 }, { id: 2 }];
      mockPrisma.application.findMany.mockResolvedValue(apps);
      const result = await service.findAllForUser(1);
      expect(result).toEqual(apps);
    });
  });

  describe('findAll', () => {
    it('should return all applications with user data', async () => {
      const apps = [{ id: 1, user: {} }];
      mockPrisma.application.findMany.mockResolvedValue(apps);
      const result = await service.findAll();
      expect(result).toEqual(apps);
    });
  });

  describe('findOne', () => {
    it('should return application by id', async () => {
      const app = { id: 1, userId: 1 };
      mockPrisma.application.findUnique.mockResolvedValue(app);
      const result = await service.findOne(1);
      expect(result).toEqual(app);
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
      const app = { id: 1, userId: 2 };
      mockPrisma.application.findUnique.mockResolvedValue(app);
      const result = await service.findOne(1, 1, 'loan_officer');
      expect(result).toEqual(app);
    });
  });

  describe('update', () => {
    it('should update a draft application', async () => {
      const app = { id: 1, userId: 1, status: 'draft', loanAmount: 20000, downPayment: null, loanTerm: null, dob: null };
      mockPrisma.application.findUnique.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue({ ...app, loanAmount: 30000 });
      const result = await service.update(1, 1, { loanAmount: 30000 });
      expect(result.loanAmount).toBe(30000);
    });
    it('should throw NotFoundException when app not found', async () => {
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
    it('should use existing values when dto fields are undefined', async () => {
      const app = { id: 1, userId: 1, status: 'draft', loanAmount: 20000, downPayment: 5000, loanTerm: 60, dob: new Date('1990-01-01') };
      mockPrisma.application.findUnique.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue(app);
      await service.update(1, 1, {});
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ loanAmount: 20000, downPayment: 5000, loanTerm: 60 }),
      });
    });
    it('should parse dob string to Date', async () => {
      const app = { id: 1, userId: 1, status: 'draft', loanAmount: null, downPayment: null, loanTerm: null, dob: null };
      mockPrisma.application.findUnique.mockResolvedValue(app);
      mockPrisma.application.update.mockResolvedValue(app);
      await service.update(1, 1, { dob: '1990-05-15' });
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ dob: new Date('1990-05-15') }),
      });
    });
  });

  describe('remove', () => {
    it('should delete a draft application', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 1, status: 'draft' });
      mockPrisma.application.delete.mockResolvedValue({});
      const result = await service.remove(1, 1);
      expect(result).toEqual({ message: 'Application deleted' });
      expect(mockPrisma.application.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
    it('should throw NotFoundException when app not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.remove(99, 1)).rejects.toThrow(NotFoundException);
    });
    it('should throw ForbiddenException when not owner', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 2, status: 'draft' });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
    it('should throw UnprocessableEntityException when not draft', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 1, status: 'submitted' });
      await expect(service.remove(1, 1)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and send notification', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'draft', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });
      const result = await service.updateStatus(1, 'submitted' as any, 1);
      expect(result.status).toBe('submitted');
      expect(mockNotifications.notifyStatusChange).toHaveBeenCalledWith('test@test.com', 'AL-000001', 'draft', 'submitted');
    });
    it('should set decidedAt and notify approved', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'under_review', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'approved' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });
      await service.updateStatus(1, 'approved' as any, 1);
      expect(mockNotifications.notifyApplicationApproved).toHaveBeenCalledWith('test@test.com', 'AL-000001');
    });
    it('should send rejection notification', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'under_review', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'rejected' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' });
      await service.updateStatus(1, 'rejected' as any, 1);
      expect(mockNotifications.notifyApplicationRejected).toHaveBeenCalledWith('test@test.com', 'AL-000001');
    });
    it('should skip notification if user not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'draft', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.updateStatus(1, 'submitted' as any, 1);
      expect(result.status).toBe('submitted');
      expect(mockNotifications.notifyStatusChange).not.toHaveBeenCalled();
    });
    it('should skip notification if user has no email', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, status: 'draft', userId: 1, applicationNumber: 'AL-000001' });
      mockPrisma.application.update.mockResolvedValue({ id: 1, status: 'submitted' });
      mockPrisma.statusHistory.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: null });
      const result = await service.updateStatus(1, 'submitted' as any, 1);
      expect(result.status).toBe('submitted');
      expect(mockNotifications.notifyStatusChange).not.toHaveBeenCalled();
    });
    it('should throw NotFoundException when app not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(99, 'submitted' as any, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
