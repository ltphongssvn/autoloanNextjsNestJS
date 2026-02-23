import { Test, TestingModule } from '@nestjs/testing';
import { SecurityAuditService, EVENT_TYPES } from './security-audit.service';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let prisma: {
    securityAuditLog: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      securityAuditLog: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SecurityAuditService>(SecurityAuditService);
  });

  describe('EVENT_TYPES', () => {
    it('should contain all expected event types', () => {
      expect(EVENT_TYPES).toContain('login_success');
      expect(EVENT_TYPES).toContain('login_failure');
      expect(EVENT_TYPES).toContain('logout');
      expect(EVENT_TYPES).toContain('mfa_setup');
      expect(EVENT_TYPES).toContain('permission_denied');
      expect(EVENT_TYPES).toContain('account_locked');
      expect(EVENT_TYPES).toContain('suspicious_activity');
      expect(EVENT_TYPES.length).toBe(16);
    });
  });

  describe('logEvent', () => {
    it('should create a security audit log entry', async () => {
      const entry = { id: 1, eventType: 'login_success', ipAddress: '127.0.0.1' };
      prisma.securityAuditLog.create.mockResolvedValue(entry);
      const result = await service.logEvent({
        eventType: 'login_success',
        ipAddress: '127.0.0.1',
        userId: 1,
        userAgent: 'Mozilla/5.0',
      });
      expect(result).toEqual(entry);
      expect(prisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: {
          eventType: 'login_success',
          userId: 1,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          resourceType: null,
          resourceId: null,
          metadata: Prisma.DbNull,
          success: true,
        },
      });
    });

    it('should default success to true', async () => {
      prisma.securityAuditLog.create.mockResolvedValue({});
      await service.logEvent({ eventType: 'login_success', ipAddress: '127.0.0.1' });
      expect(prisma.securityAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ success: true }) }),
      );
    });

    it('should accept success=false', async () => {
      prisma.securityAuditLog.create.mockResolvedValue({});
      await service.logEvent({ eventType: 'login_failure', ipAddress: '127.0.0.1', success: false });
      expect(prisma.securityAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ success: false }) }),
      );
    });

    it('should handle optional fields with DbNull for metadata', async () => {
      prisma.securityAuditLog.create.mockResolvedValue({});
      await service.logEvent({ eventType: 'logout', ipAddress: '10.0.0.1' });
      expect(prisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: {
          eventType: 'logout',
          userId: null,
          ipAddress: '10.0.0.1',
          userAgent: null,
          resourceType: null,
          resourceId: null,
          metadata: Prisma.DbNull,
          success: true,
        },
      });
    });

    it('should store metadata as JSON', async () => {
      prisma.securityAuditLog.create.mockResolvedValue({});
      await service.logEvent({
        eventType: 'suspicious_activity',
        ipAddress: '192.168.1.1',
        metadata: { reason: 'multiple_failed_attempts', count: 5 },
      });
      expect(prisma.securityAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: { reason: 'multiple_failed_attempts', count: 5 } }),
        }),
      );
    });

    it('should return null and log error on failure', async () => {
      prisma.securityAuditLog.create.mockRejectedValue(new Error('DB error'));
      const result = await service.logEvent({ eventType: 'login_success', ipAddress: '127.0.0.1' });
      expect(result).toBeNull();
    });

    it('should include resourceType and resourceId when provided', async () => {
      prisma.securityAuditLog.create.mockResolvedValue({});
      await service.logEvent({
        eventType: 'permission_denied',
        ipAddress: '127.0.0.1',
        resourceType: 'Application',
        resourceId: 42,
      });
      expect(prisma.securityAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ resourceType: 'Application', resourceId: 42 }),
        }),
      );
    });
  });

  describe('failedLoginsForIp', () => {
    it('should count failed logins for an IP', async () => {
      prisma.securityAuditLog.count.mockResolvedValue(3);
      const result = await service.failedLoginsForIp('192.168.1.1');
      expect(result).toBe(3);
      expect(prisma.securityAuditLog.count).toHaveBeenCalledWith({
        where: {
          eventType: 'login_failure',
          ipAddress: '192.168.1.1',
          createdAt: { gte: expect.any(Date) },
        },
      });
    });

    it('should accept custom since date', async () => {
      const since = new Date('2025-01-01');
      prisma.securityAuditLog.count.mockResolvedValue(0);
      await service.failedLoginsForIp('10.0.0.1', since);
      expect(prisma.securityAuditLog.count).toHaveBeenCalledWith({
        where: {
          eventType: 'login_failure',
          ipAddress: '10.0.0.1',
          createdAt: { gte: since },
        },
      });
    });
  });

  describe('failedLoginsForUser', () => {
    it('should count failed logins for a user', async () => {
      prisma.securityAuditLog.count.mockResolvedValue(5);
      const result = await service.failedLoginsForUser(1);
      expect(result).toBe(5);
      expect(prisma.securityAuditLog.count).toHaveBeenCalledWith({
        where: {
          eventType: 'login_failure',
          userId: 1,
          createdAt: { gte: expect.any(Date) },
        },
      });
    });

    it('should accept custom since date', async () => {
      const since = new Date('2025-06-01');
      prisma.securityAuditLog.count.mockResolvedValue(2);
      await service.failedLoginsForUser(5, since);
      expect(prisma.securityAuditLog.count).toHaveBeenCalledWith({
        where: {
          eventType: 'login_failure',
          userId: 5,
          createdAt: { gte: since },
        },
      });
    });
  });

  describe('findByUser', () => {
    it('should return logs for a user', async () => {
      const logs = [{ id: 1 }, { id: 2 }];
      prisma.securityAuditLog.findMany.mockResolvedValue(logs);
      const result = await service.findByUser(1);
      expect(result).toEqual(logs);
      expect(prisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });

    it('should accept custom limit', async () => {
      prisma.securityAuditLog.findMany.mockResolvedValue([]);
      await service.findByUser(1, 5);
      expect(prisma.securityAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe('findByEventType', () => {
    it('should return logs by event type', async () => {
      prisma.securityAuditLog.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await service.findByEventType('mfa_setup');
      expect(result).toEqual([{ id: 1 }]);
      expect(prisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: { eventType: 'mfa_setup' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });
  });

  describe('findRecent', () => {
    it('should return recent logs with default limit', async () => {
      prisma.securityAuditLog.findMany.mockResolvedValue([]);
      await service.findRecent();
      expect(prisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should accept custom limit', async () => {
      prisma.securityAuditLog.findMany.mockResolvedValue([]);
      await service.findRecent(10);
      expect(prisma.securityAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });
});
