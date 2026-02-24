// apps/backend/src/applications/agreement-pdf.service.ts
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class AgreementPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(applicationId: number, userId: number, role?: string): Promise<{ buffer: Buffer; filename: string }> {
    const isStaff = role === 'loan_officer' || role === 'underwriter';
    const whereClause = isStaff
      ? { id: applicationId }
      : { id: applicationId, userId };

    const application = await this.prisma.application.findFirst({
      where: whereClause,
      include: { user: true, addresses: true, vehicles: true, financialInfos: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'approved' && application.status !== 'signed') {
      throw new UnprocessableEntityException('PDF only available for approved or signed applications');
    }
    const appNum = application.applicationNumber || `APP-${String(application.id).padStart(4, '0')}`;
    const buffer = await this.buildPdf(application, appNum);
    const filename = `loan_agreement_${appNum}.pdf`;
    return { buffer, filename };
  }

  private buildPdf(app: any, appNum: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const address = app.addresses?.find((a: any) => a.addressType === 'residential');
      const vehicle = app.vehicles?.[0];
      const loanAmount = Number(app.loanAmount) || 0;
      const downPayment = Number(app.downPayment) || 0;
      const principal = loanAmount - downPayment;
      const rate = Number(app.interestRate) || 0;
      const term = app.loanTerm || 48;
      const monthly = Number(app.monthlyPayment) || 0;
      const totalPayments = monthly * term;
      const totalInterest = totalPayments - principal;

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('AUTO LOAN AGREEMENT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Loan Agreement #${appNum}`, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).text(`Date: ${this.formatDate(new Date())}`, { align: 'center' });
      doc.moveDown(2);

      // Borrower Information
      this.sectionHeader(doc, 'BORROWER INFORMATION');
      this.tableRow(doc, 'Name:', `${app.user?.firstName || ''} ${app.user?.lastName || ''}`);
      this.tableRow(doc, 'Address:', address ? `${address.streetAddress}, ${address.city}, ${address.state} ${address.zipCode}` : 'N/A');
      this.tableRow(doc, 'Phone:', app.user?.phone || 'N/A');
      this.tableRow(doc, 'Email:', app.user?.email || 'N/A');
      doc.moveDown(1);

      // Loan Details
      this.sectionHeader(doc, 'LOAN DETAILS');
      this.tableRow(doc, 'Loan Amount:', `$${this.fmt(loanAmount)}`);
      this.tableRow(doc, 'Down Payment:', `$${this.fmt(downPayment)}`);
      this.tableRow(doc, 'Amount Financed:', `$${this.fmt(principal)}`);
      this.tableRow(doc, 'Annual Percentage Rate (APR):', `${rate}%`);
      this.tableRow(doc, 'Loan Term:', `${term} months`);
      this.tableRow(doc, 'Monthly Payment:', `$${this.fmt(monthly)}`);
      this.tableRow(doc, 'Total of Payments:', `$${this.fmt(totalPayments)}`);
      this.tableRow(doc, 'Total Interest:', `$${this.fmt(totalInterest)}`);
      doc.moveDown(1);

      // Vehicle Information
      this.sectionHeader(doc, 'VEHICLE INFORMATION');
      this.tableRow(doc, 'Year:', vehicle?.year?.toString() || 'N/A');
      this.tableRow(doc, 'Make:', vehicle?.make || 'N/A');
      this.tableRow(doc, 'Model:', vehicle?.model || 'N/A');
      this.tableRow(doc, 'VIN:', vehicle?.vin || 'N/A');
      this.tableRow(doc, 'Mileage:', vehicle?.mileage ? `${this.fmt(vehicle.mileage)} miles` : 'N/A');
      this.tableRow(doc, 'Condition:', vehicle?.condition ? this.titleize(vehicle.condition) : 'N/A');
      this.tableRow(doc, 'Vehicle Value:', vehicle?.estimatedValue ? `$${this.fmt(Number(vehicle.estimatedValue))}` : 'N/A');
      doc.moveDown(1);

      // Payment Schedule
      this.sectionHeader(doc, 'PAYMENT SCHEDULE');
      const firstPayment = new Date();
      firstPayment.setMonth(firstPayment.getMonth() + 1, 1);
      doc.fontSize(11).font('Helvetica')
        .text(`First Payment Due: ${this.formatDate(firstPayment)}`)
        .text('Payments are due on the 1st of each month.');
      doc.moveDown(1);

      // Terms and Conditions
      this.sectionHeader(doc, 'TERMS AND CONDITIONS');
      const terms = [
        '1. The Borrower agrees to repay the loan amount plus interest as specified above.',
        '2. Late payments may result in additional fees and penalties.',
        '3. The vehicle serves as collateral for this loan.',
        '4. Full payoff is permitted at any time without prepayment penalty.',
        '5. Borrower must maintain full coverage insurance on the vehicle.',
        '6. Failure to make payments may result in repossession of the vehicle.',
        '7. This agreement is governed by the laws of the state specified in the borrower\'s address.',
      ];
      doc.fontSize(10).font('Helvetica');
      terms.forEach((t) => doc.text(t, { lineGap: 4 }));
      doc.moveDown(2);

      // Signature Block
      this.sectionHeader(doc, 'SIGNATURES');
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica')
        .text('By signing below, I acknowledge that I have read, understand, and agree to the terms of this loan agreement.');
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(300, doc.y).stroke();
      doc.moveDown(0.3);
      doc.text('Borrower Signature');
      doc.text(`${app.user?.firstName || ''} ${app.user?.lastName || ''}`);
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
      doc.moveDown(0.3);
      doc.text('Date');
      if (app.signedAt) {
        doc.text(this.formatDate(new Date(app.signedAt)));
      }

      doc.end();
    });
  }

  private sectionHeader(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(14).font('Helvetica-Bold').text(title);
    doc.moveDown(0.5);
  }

  private tableRow(doc: PDFKit.PDFDocument, label: string, value: string) {
    const y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').text(label, 50, y, { width: 200, continued: false });
    doc.fontSize(10).font('Helvetica').text(value, 250, y);
  }

  private fmt(n: number): string {
    const parts = n.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  private formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  }

  private titleize(s: string): string {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
