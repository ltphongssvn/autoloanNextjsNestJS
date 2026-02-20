// apps/backend/src/documents/index.spec.ts
import { DocumentsModule, DocumentsService, DocumentsController } from './index';

describe('Documents barrel export', () => {
  it('should export DocumentsModule', () => expect(DocumentsModule).toBeDefined());
  it('should export DocumentsService', () => expect(DocumentsService).toBeDefined());
  it('should export DocumentsController', () => expect(DocumentsController).toBeDefined());
});
