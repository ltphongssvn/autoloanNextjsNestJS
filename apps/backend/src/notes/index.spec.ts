// apps/backend/src/notes/index.spec.ts
import { NotesModule, NotesService, NotesController } from './index';

describe('Notes barrel export', () => {
  it('should export NotesModule', () => expect(NotesModule).toBeDefined());
  it('should export NotesService', () => expect(NotesService).toBeDefined());
  it('should export NotesController', () => expect(NotesController).toBeDefined());
});
