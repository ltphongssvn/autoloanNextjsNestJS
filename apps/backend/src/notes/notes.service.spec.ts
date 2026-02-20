// apps/backend/src/notes/notes.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma.service';

describe('NotesService', () => {
  let service: NotesService;
  const mockPrisma = {
    application: { findUnique: jest.fn() },
    applicationNote: { create: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(() => {
    service = new NotesService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a note', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, content: 'Test note' });
      const result = await service.create(1, 1, 'Test note');
      expect(result.content).toBe('Test note');
    });

    it('should throw NotFoundException if application not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.create(99, 1, 'note')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByApplication', () => {
    it('should return notes for application', async () => {
      const notes = [{ id: 1, content: 'note1' }, { id: 2, content: 'note2' }];
      mockPrisma.applicationNote.findMany.mockResolvedValue(notes);
      const result = await service.findByApplication(1);
      expect(result).toEqual(notes);
    });
  });
});
