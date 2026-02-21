// apps/backend/src/applications/applications.module.ts
import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { LoanOfficerController } from './loan-officer.controller';
import { UnderwriterController } from './underwriter.controller';
import { ApplicationsService } from './applications.service';
import { StatusHistoryService } from './status-history.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { AgreementPdfService } from './agreement-pdf.service';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications';
@Module({
  imports: [NotificationsModule],
  controllers: [ApplicationsController, LoanOfficerController, UnderwriterController],
  providers: [ApplicationsService, StatusHistoryService, ApplicationWorkflowService, AgreementPdfService, PrismaService],
  exports: [ApplicationsService, StatusHistoryService, ApplicationWorkflowService],
})
export class ApplicationsModule {}
