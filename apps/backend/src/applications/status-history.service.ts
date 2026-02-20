// apps/backend/src/applications/status-history.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findByApplication(applicationId: number) {
    return this.prisma.statusHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }
}
