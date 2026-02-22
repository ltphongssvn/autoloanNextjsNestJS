// apps/backend/src/applications/application-workflow.service.ts
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ApplicationStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['pending', 'under_review', 'pending_documents'],
  pending: ['under_review', 'pending_documents'],
  under_review: ['pending_documents', 'approved', 'rejected'],
  pending_documents: ['under_review', 'approved', 'rejected'],
};

@Injectable()
export class ApplicationWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTransition(currentStatus: string, targetStatus: string, allowedFrom: string[]) {
    if (!allowedFrom.includes(currentStatus)) {
      throw new UnprocessableEntityException(
        `Cannot transition from ${currentStatus} to ${targetStatus}. Allowed from: ${allowedFrom.join(', ')}`,
      );
    }
  }

  canTransitionTo(currentStatus: string, targetStatus: string): boolean {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  async submit(applicationId: number, userId: number) {
    const app = await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    this.validateTransition(app.status, 'submitted', ['draft']);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.submitted, submittedAt: new Date() },
    });
    await this.createHistory(applicationId, userId, app.status, 'submitted');
    return updated;
  }

  async startVerification(applicationId: number, userId: number) {
    const app = await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    this.validateTransition(app.status, 'under_review', ['submitted']);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.under_review },
    });
    await this.createHistory(applicationId, userId, app.status, 'under_review');
    return updated;
  }

  async moveToReview(applicationId: number, userId: number) {
    const app = await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    this.validateTransition(app.status, 'under_review', ['submitted', 'pending_documents']);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.under_review },
    });
    await this.createHistory(applicationId, userId, app.status, 'under_review');
    return updated;
  }

  async requestDocuments(applicationId: number, userId: number) {
    const app = await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    this.validateTransition(app.status, 'pending_documents', ['submitted', 'under_review']);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.pending_documents },
    });
    await this.createHistory(applicationId, userId, app.status, 'pending_documents');
    return updated;
  }

  async approve(
    applicationId: number,
    userId: number,
    data: { loanTerm?: number; interestRate?: number; monthlyPayment?: number },
  ) {
    const app = await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    this.validateTransition(app.status, 'approved', ['under_review', 'pending_documents']);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.approved,
        loanTerm: data.loanTerm ?? app.loanTerm,
        interestRate: data.interestRate ?? app.interestRate,
        monthlyPayment: data.monthlyPayment ?? app.monthlyPayment,
        decidedAt: new Date(),
      },
    });
    await this.createHistory(applicationId, userId, app.status, 'approved');
    return updated;
  }

  async reject(applicationId: number, userId: number, reason?: string) {
    const app = await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    this.validateTransition(app.status, 'rejected', ['under_review', 'pending_documents']);
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.rejected,
        rejectionReason: reason,
        decidedAt: new Date(),
      },
    });
    await this.createHistory(applicationId, userId, app.status, 'rejected');
    return updated;
  }

  async sign(applicationId: number, userId: number, signatureData: string) {
    const app = await this.prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    if (app.status !== ApplicationStatus.approved) {
      throw new UnprocessableEntityException('Application must be approved before signing');
    }
    if (app.signedAt) {
      throw new UnprocessableEntityException('Application already signed');
    }
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        signatureData,
        signedAt: new Date(),
        agreementAccepted: true,
      },
    });
    return updated;
  }

  private async createHistory(
    applicationId: number,
    userId: number,
    fromStatus: string,
    toStatus: string,
  ) {
    await this.prisma.statusHistory.create({
      data: { applicationId, userId, fromStatus, toStatus },
    });
  }
}
