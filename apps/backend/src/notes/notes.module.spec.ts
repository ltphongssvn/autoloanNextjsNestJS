// apps/backend/src/notes/notes.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotesModule } from './notes.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesModule', () => {
  let module: TestingModule;
  beforeEach(async () => { module = await Test.createTestingModule({ imports: [NotesModule] }).compile(); });
  it('should compile', () => expect(module).toBeDefined());
  it('should provide NotesController', () => expect(module.get<NotesController>(NotesController)).toBeDefined());
  it('should provide NotesService', () => expect(module.get<NotesService>(NotesService)).toBeDefined());
});
