// apps/backend/src/applications/applications.module.ts
import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { StatusHistoryService } from './status-history.service';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [NotificationsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, StatusHistoryService, PrismaService],
  exports: [ApplicationsService, StatusHistoryService],
})
export class ApplicationsModule {}
