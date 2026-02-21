// apps/backend/src/applications/applications.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsModule } from './applications.module';
import { ApplicationsController } from './applications.controller';
import { LoanOfficerController } from './loan-officer.controller';
import { UnderwriterController } from './underwriter.controller';
import { ApplicationsService } from './applications.service';
import { StatusHistoryService } from './status-history.service';
import { ApplicationWorkflowService } from './application-workflow.service';

describe('ApplicationsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({ imports: [ApplicationsModule] }).compile();
  });

  it('should compile', () => expect(module).toBeDefined());
  it('should provide ApplicationsController', () => expect(module.get<ApplicationsController>(ApplicationsController)).toBeDefined());
  it('should provide LoanOfficerController', () => expect(module.get<LoanOfficerController>(LoanOfficerController)).toBeDefined());
  it('should provide UnderwriterController', () => expect(module.get<UnderwriterController>(UnderwriterController)).toBeDefined());
  it('should provide ApplicationsService', () => expect(module.get<ApplicationsService>(ApplicationsService)).toBeDefined());
  it('should provide StatusHistoryService', () => expect(module.get<StatusHistoryService>(StatusHistoryService)).toBeDefined());
  it('should provide ApplicationWorkflowService', () => expect(module.get<ApplicationWorkflowService>(ApplicationWorkflowService)).toBeDefined());
});
