// apps/backend/src/documents/documents.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsModule } from './documents.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({ imports: [DocumentsModule] }).compile();
  });

  it('should compile', () => expect(module).toBeDefined());
  it('should provide DocumentsController', () => expect(module.get<DocumentsController>(DocumentsController)).toBeDefined());
  it('should provide DocumentsService', () => expect(module.get<DocumentsService>(DocumentsService)).toBeDefined());
});
