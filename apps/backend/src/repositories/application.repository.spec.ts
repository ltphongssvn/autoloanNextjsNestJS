import { ApplicationRepository } from './application.repository';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

describe('ApplicationRepository', () => {
  let repo: ApplicationRepository;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      application: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    repo = new ApplicationRepository(prisma as unknown as PrismaService);
  });

  describe('findWithAssociations', () => {
    it('should return application with includes', async () => {
      const app = { id: 1, addresses: [], vehicles: [], financialInfos: [], documents: [] };
      prisma.application.findUnique.mockResolvedValue(app);
      const result = await repo.findWithAssociations(1);
      expect(result).toEqual(app);
      expect(prisma.application.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { addresses: true, vehicles: true, financialInfos: true, documents: true },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      await expect(repo.findWithAssociations(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('forUser', () => {
    it('should return applications for user', async () => {
      prisma.application.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await repo.forUser(5);
      expect(result).toEqual([{ id: 1 }]);
      expect(prisma.application.findMany).toHaveBeenCalledWith({
        where: { userId: 5 },
        include: { addresses: true, vehicles: true, financialInfos: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('forLoanOfficer', () => {
    it('should return submitted/review/pending applications', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      await repo.forLoanOfficer();
      expect(prisma.application.findMany).toHaveBeenCalledWith({
        where: { status: { in: ['submitted', 'under_review', 'pending_documents'] } },
        include: { user: true, addresses: true, vehicles: true, financialInfos: true },
        orderBy: { submittedAt: 'desc' },
      });
    });
  });

  describe('forUnderwriter', () => {
    it('should return review/approved/rejected applications', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      await repo.forUnderwriter();
      expect(prisma.application.findMany).toHaveBeenCalledWith({
        where: { status: { in: ['under_review', 'pending_documents', 'approved', 'rejected'] } },
        include: { user: true, addresses: true, vehicles: true, financialInfos: true },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findByApplicationNumber', () => {
    it('should find by application number', async () => {
      prisma.application.findUnique.mockResolvedValue({ id: 1, applicationNumber: 'AL-2026-00001' });
      const result = await repo.findByApplicationNumber('AL-2026-00001');
      expect(result).toEqual({ id: 1, applicationNumber: 'AL-2026-00001' });
    });
  });

  describe('pendingReviewCount', () => {
    it('should count pending review applications', async () => {
      prisma.application.count.mockResolvedValue(3);
      expect(await repo.pendingReviewCount()).toBe(3);
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { status: { in: ['submitted', 'under_review'] } },
      });
    });
  });

  describe('withStatus', () => {
    it('should return applications with given status', async () => {
      prisma.application.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await repo.withStatus('approved');
      expect(result).toEqual([{ id: 1 }]);
      expect(prisma.application.findMany).toHaveBeenCalledWith({ where: { status: 'approved' } });
    });
  });

  describe('recent', () => {
    it('should return recent applications with default limit', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      await repo.recent();
      expect(prisma.application.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should accept custom limit', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      await repo.recent(5);
      expect(prisma.application.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });
});
