// apps/backend/src/applications/agreement-pdf.service.ts
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AgreementPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(applicationId: number, userId: number): Promise<{ buffer: Buffer; filename: string }> {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { user: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'approved' && application.status !== 'signed') {
      throw new UnprocessableEntityException('PDF only available for approved or signed applications');
    }

    const appNum = application.applicationNumber || `APP-${String(application.id).padStart(4, '0')}`;
    const content = this.buildContent(application, appNum);
    const buffer = Buffer.from(content, 'utf-8');
    const filename = `loan_agreement_${appNum}.txt`;

    return { buffer, filename };
  }

  private buildContent(app: any, appNum: string): string {
    const lines = [
      '='.repeat(60),
      '           AUTO LOAN AGREEMENT',
      '='.repeat(60),
      '',
      `Application Number: ${appNum}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      '--- BORROWER INFORMATION ---',
      `Name: ${app.user?.firstName || ''} ${app.user?.lastName || ''}`,
      `Email: ${app.user?.email || ''}`,
      '',
      '--- LOAN TERMS ---',
      `Loan Amount: $${app.loanAmount || '0.00'}`,
      `Down Payment: $${app.downPayment || '0.00'}`,
      `Loan Term: ${app.loanTerm || 0} months`,
      `Interest Rate: ${app.interestRate || '0.00'}%`,
      `Monthly Payment: $${app.monthlyPayment || '0.00'}`,
      '',
      '--- STATUS ---',
      `Status: ${app.status}`,
      app.signedAt ? `Signed: ${new Date(app.signedAt).toLocaleDateString()}` : '',
      '',
      '='.repeat(60),
      'This document serves as the loan agreement between the',
      'borrower and AutoLoan. By signing, the borrower agrees',
      'to the terms outlined above.',
      '='.repeat(60),
    ];
    return lines.filter(Boolean).join('\n');
  }
}
