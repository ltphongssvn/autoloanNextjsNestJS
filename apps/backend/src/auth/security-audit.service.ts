// apps/backend/src/auth/security-audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export const EVENT_TYPES = [
  'login_success',
  'login_failure',
  'logout',
  'token_refresh',
  'mfa_setup',
  'mfa_enabled',
  'mfa_disabled',
  'mfa_verify_success',
  'mfa_verify_failure',
  'permission_denied',
  'rate_limit_exceeded',
  'invalid_token',
  'password_reset_request',
  'password_changed',
  'account_locked',
  'suspicious_activity',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface LogEventParams {
  eventType: EventType;
  ipAddress: string;
  userId?: number;
  userAgent?: string;
  resourceType?: string;
  resourceId?: number;
  metadata?: Prisma.InputJsonValue;
  success?: boolean;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private prisma: PrismaService) {}

  async logEvent(params: LogEventParams) {
    try {
      return await this.prisma.securityAuditLog.create({
        data: {
          eventType: params.eventType,
          userId: params.userId ?? null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent ?? null,
          resourceType: params.resourceType ?? null,
          resourceId: params.resourceId ?? null,
          metadata: params.metadata ?? Prisma.DbNull,
          success: params.success ?? true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log security event: ${(error as Error).message}`);
      return null;
    }
  }

  async failedLoginsForIp(ipAddress: string, since?: Date) {
    const sinceDate = since ?? new Date(Date.now() - 15 * 60 * 1000);
    return this.prisma.securityAuditLog.count({
      where: {
        eventType: 'login_failure',
        ipAddress,
        createdAt: { gte: sinceDate },
      },
    });
  }

  async failedLoginsForUser(userId: number, since?: Date) {
    const sinceDate = since ?? new Date(Date.now() - 15 * 60 * 1000);
    return this.prisma.securityAuditLog.count({
      where: {
        eventType: 'login_failure',
        userId,
        createdAt: { gte: sinceDate },
      },
    });
  }

  async findByUser(userId: number, limit = 20) {
    return this.prisma.securityAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByEventType(eventType: EventType, limit = 20) {
    return this.prisma.securityAuditLog.findMany({
      where: { eventType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findRecent(limit = 50) {
    return this.prisma.securityAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
