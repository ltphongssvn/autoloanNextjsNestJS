// apps/backend/src/documents/documents.service.spec.ts
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const mockPrisma = {
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new DocumentsService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should create a document record', async () => {
      const file = { originalname: 'test.pdf', size: 1024, mimetype: 'application/pdf', filename: 'abc123.pdf' } as Express.Multer.File;
      mockPrisma.document.create.mockResolvedValue({ id: 1, fileName: 'test.pdf' });
      const result = await service.upload(1, 1, file, 'pay_stub');
      expect(result.fileName).toBe('test.pdf');
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ applicationId: 1, docType: 'pay_stub', fileName: 'test.pdf', status: 'uploaded' }),
      });
    });
    it('should use originalname when filename is missing', async () => {
      const file = { originalname: 'doc.pdf', size: 512, mimetype: 'application/pdf' } as Express.Multer.File;
      mockPrisma.document.create.mockResolvedValue({ id: 1 });
      await service.upload(1, 1, file, 'other');
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ fileUrl: '/uploads/doc.pdf' }),
      });
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

  describe('findOne', () => {
    it('should return a document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, fileName: 'test.pdf' });
      const result = await service.findOne(1);
      expect(result.fileName).toBe('test.pdf');
    });
    it('should throw NotFoundException', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, application: { userId: 1 } });
      mockPrisma.document.delete.mockResolvedValue({});
      const result = await service.remove(1, 1);
      expect(result).toEqual({ message: 'Document deleted' });
    });
    it('should throw NotFoundException', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(service.remove(99, 1)).rejects.toThrow(NotFoundException);
    });
    it('should throw ForbiddenException when not owner', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, application: { userId: 2 } });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update to verified with timestamp', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, rejectionNote: null });
      mockPrisma.document.update.mockResolvedValue({ id: 1, status: 'verified' });
      const result = await service.updateStatus(1, 'verified', 2);
      expect(result.status).toBe('verified');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'verified', verifiedAt: expect.any(Date) }),
      });
    });
    it('should update to rejected with note', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, rejectionNote: null });
      mockPrisma.document.update.mockResolvedValue({ id: 1, status: 'rejected' });
      const result = await service.updateStatus(1, 'rejected', 2, 'Blurry image');
      expect(result.status).toBe('rejected');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ rejectionNote: 'Blurry image' }),
      });
    });
    it('should keep existing rejectionNote when not provided', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, rejectionNote: 'Old note' });
      mockPrisma.document.update.mockResolvedValue({ id: 1, status: 'verified' });
      await service.updateStatus(1, 'verified', 2);
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ rejectionNote: 'Old note' }),
      });
    });
    it('should throw NotFoundException', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(99, 'verified', 2)).rejects.toThrow(NotFoundException);
    });
  });
});
