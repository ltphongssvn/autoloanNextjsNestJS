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
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, note: 'Test note' });
      const result = await service.create(1, 1, 'Test note');
      expect(result.note).toBe('Test note');
      expect(mockPrisma.applicationNote.create).toHaveBeenCalledWith({
        data: { applicationId: 1, userId: 1, note: 'Test note', internal: false },
        include: { user: true },
      });
    });

    it('should create an internal note', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.applicationNote.create.mockResolvedValue({ id: 1, note: 'Internal', internal: true });
      const result = await service.create(1, 1, 'Internal', true);
      expect(result.internal).toBe(true);
    });

    it('should throw NotFoundException if application not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.create(99, 1, 'note')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByApplication', () => {
    it('should return notes for application', async () => {
      const notes = [{ id: 1, note: 'note1' }, { id: 2, note: 'note2' }];
      mockPrisma.applicationNote.findMany.mockResolvedValue(notes);
      const result = await service.findByApplication(1);
      expect(result).toEqual(notes);
    });
  });
});
