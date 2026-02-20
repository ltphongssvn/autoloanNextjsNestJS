// apps/backend/src/documents/documents.service.spec.ts
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const mockPrisma = {
    application: { findUnique: jest.fn() },
    document: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(() => {
    service = new DocumentsService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should create a document', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      mockPrisma.document.create.mockResolvedValue({ id: 1, fileName: 'test.pdf' });
      const result = await service.upload(1, 1, 'test.pdf', 'id_document', '/uploads/test.pdf');
      expect(result.fileName).toBe('test.pdf');
    });

    it('should throw NotFoundException if application not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.upload(99, 1, 'f', 't', 'p')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own application', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1, userId: 2 });
      await expect(service.upload(1, 1, 'f', 't', 'p')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByApplication', () => {
    it('should return documents for application', async () => {
      const docs = [{ id: 1 }, { id: 2 }];
      mockPrisma.document.findMany.mockResolvedValue(docs);
      const result = await service.findByApplication(1);
      expect(result).toEqual(docs);
    });
  });

  describe('updateStatus', () => {
    it('should update document status', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.update.mockResolvedValue({ id: 1, status: 'approved' });
      const result = await service.updateStatus(1, 'approved' as any);
      expect(result.status).toBe('approved');
    });

    it('should throw NotFoundException if document not found', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(99, 'approved' as any)).rejects.toThrow(NotFoundException);
    });
  });
});
