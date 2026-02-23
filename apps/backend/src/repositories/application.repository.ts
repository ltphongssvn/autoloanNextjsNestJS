// apps/backend/src/repositories/application.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class ApplicationRepository extends BaseRepository<PrismaService['application']> {
  protected readonly modelName = 'Application';

  constructor(prisma: PrismaService) {
    super(prisma, prisma.application);
  }

  async findWithAssociations(id: number) {
    const record = await this.prisma.application.findUnique({
      where: { id },
      include: { addresses: true, vehicles: true, financialInfos: true, documents: true },
    });
    if (!record) throw new (await import('@nestjs/common')).NotFoundException(`Application with id ${id} not found`);
    return record;
  }

  async forUser(userId: number) {
    return this.prisma.application.findMany({
      where: { userId },
      include: { addresses: true, vehicles: true, financialInfos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async forLoanOfficer() {
    return this.prisma.application.findMany({
      where: { status: { in: ['submitted', 'under_review', 'pending_documents'] } },
      include: { user: true, addresses: true, vehicles: true, financialInfos: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async forUnderwriter() {
    return this.prisma.application.findMany({
      where: { status: { in: ['under_review', 'pending_documents', 'approved', 'rejected'] } },
      include: { user: true, addresses: true, vehicles: true, financialInfos: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByApplicationNumber(applicationNumber: string) {
    return this.prisma.application.findUnique({ where: { applicationNumber } });
  }

  async pendingReviewCount() {
    return this.prisma.application.count({
      where: { status: { in: ['submitted', 'under_review'] } },
    });
  }

  async withStatus(status: string) {
    return this.prisma.application.findMany({ where: { status: status as any } });
  }

  async recent(limit = 10) {
    return this.prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
