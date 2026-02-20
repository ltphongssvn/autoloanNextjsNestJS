import { Injectable, Logger } from '@nestjs/common';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(payload: EmailPayload): Promise<boolean> {
    this.logger.log(`Sending email to ${payload.to}: ${payload.subject}`);
    // In production, integrate with SMTP/SendGrid/SES
    // For now, log and return success
    return true;
  }

  async notifyStatusChange(email: string, applicationNumber: string, oldStatus: string, newStatus: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Application ${applicationNumber} - Status Update`,
      body: `Your loan application ${applicationNumber} status has changed from "${oldStatus}" to "${newStatus}".`,
    });
  }

  async notifyApplicationSubmitted(email: string, applicationNumber: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Application ${applicationNumber} - Received`,
      body: `Your loan application ${applicationNumber} has been submitted successfully. We will review it shortly.`,
    });
  }

  async notifyDocumentUploaded(email: string, applicationNumber: string, docType: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Application ${applicationNumber} - Document Uploaded`,
      body: `A new document (${docType}) has been uploaded for application ${applicationNumber}.`,
    });
  }

  async notifyApplicationApproved(email: string, applicationNumber: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Application ${applicationNumber} - Approved!`,
      body: `Congratulations! Your loan application ${applicationNumber} has been approved.`,
    });
  }

  async notifyApplicationRejected(email: string, applicationNumber: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Application ${applicationNumber} - Decision`,
      body: `We regret to inform you that your loan application ${applicationNumber} has not been approved at this time.`,
    });
  }
}
