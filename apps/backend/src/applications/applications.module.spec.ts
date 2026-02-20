// apps/backend/src/applications/applications.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsModule } from './applications.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { StatusHistoryService } from './status-history.service';

describe('ApplicationsModule', () => {
  let module: TestingModule;
  beforeEach(async () => { module = await Test.createTestingModule({ imports: [ApplicationsModule] }).compile(); });
  it('should compile', () => expect(module).toBeDefined());
  it('should provide ApplicationsController', () => expect(module.get<ApplicationsController>(ApplicationsController)).toBeDefined());
  it('should provide ApplicationsService', () => expect(module.get<ApplicationsService>(ApplicationsService)).toBeDefined());
  it('should provide StatusHistoryService', () => expect(module.get<StatusHistoryService>(StatusHistoryService)).toBeDefined());
});
