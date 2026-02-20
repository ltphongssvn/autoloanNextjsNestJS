// apps/backend/src/applications/index.spec.ts
import { ApplicationsModule, ApplicationsService, ApplicationsController, CreateApplicationDto, StatusHistoryService } from './index';

describe('Applications barrel export', () => {
  it('should export ApplicationsModule', () => expect(ApplicationsModule).toBeDefined());
  it('should export ApplicationsService', () => expect(ApplicationsService).toBeDefined());
  it('should export ApplicationsController', () => expect(ApplicationsController).toBeDefined());
  it('should export CreateApplicationDto', () => expect(CreateApplicationDto).toBeDefined());
  it('should export StatusHistoryService', () => expect(StatusHistoryService).toBeDefined());
});
