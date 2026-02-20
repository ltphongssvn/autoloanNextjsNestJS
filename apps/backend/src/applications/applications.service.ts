// apps/backend/src/applications/applications.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateApplicationDto } from './create-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateApplicationDto) {
    const count = await this.prisma.application.count({ where: { userId } });
    const appNumber = `AL-${String(count + 1).padStart(6, '0')}`;
    return this.prisma.application.create({
      data: {
        userId,
        applicationNumber: appNumber,
        loanAmount: dto.loanAmount,
        downPayment: dto.downPayment,
        loanTerm: dto.loanTerm,
      },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async findOne(id: number, userId?: number, role?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        documents: true,
        addresses: true,
        vehicles: true,
        financialInfos: true,
        statusHistories: { orderBy: { createdAt: 'desc' }, include: { user: true } },
      },
    });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    if (role === 'customer' && application.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return application;
  }

  async updateStatus(id: number, status: ApplicationStatus, userId: number) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    const fromStatus = application.status;
    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        status,
        decidedAt: ['approved', 'rejected'].includes(status) ? new Date() : undefined,
      },
    });
    await this.prisma.statusHistory.create({
      data: {
        applicationId: id,
        userId,
        fromStatus,
        toStatus: status,
      },
    });
    return updated;
  }
}
