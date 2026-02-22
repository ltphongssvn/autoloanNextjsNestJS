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
    it('should create a document record with download_url', async () => {
      const file = { originalname: 'test.pdf', size: 1024, mimetype: 'application/pdf', filename: 'abc123.pdf' } as Express.Multer.File;
      mockPrisma.document.create.mockResolvedValue({ id: 1, applicationId: 5, fileName: 'test.pdf', fileUrl: '/uploads/abc123.pdf' });
      const result = await service.upload(5, 1, file, 'pay_stub');
      expect(result.fileName).toBe('test.pdf');
      expect(result.download_url).toBe('/api/v1/applications/5/documents/1/download');
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ applicationId: 5, docType: 'pay_stub', fileName: 'test.pdf', status: 'uploaded' }),
      });
    });
    it('should use originalname when filename is missing', async () => {
      const file = { originalname: 'doc.pdf', size: 512, mimetype: 'application/pdf' } as Express.Multer.File;
      mockPrisma.document.create.mockResolvedValue({ id: 1, applicationId: 1, fileUrl: '/uploads/doc.pdf' });
      await service.upload(1, 1, file, 'other');
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ fileUrl: '/uploads/doc.pdf' }),
      });
    });
    it('should return null download_url when no fileUrl', async () => {
      const file = { originalname: 'test.pdf', size: 1024, mimetype: 'application/pdf', filename: 'x.pdf' } as Express.Multer.File;
      mockPrisma.document.create.mockResolvedValue({ id: 1, applicationId: 1, fileUrl: null });
      const result = await service.upload(1, 1, file, 'other');
      expect(result.download_url).toBeNull();
    });
  });

  describe('findByApplication', () => {
    it('should return documents with download_url', async () => {
      const docs = [
        { id: 1, applicationId: 3, fileUrl: '/uploads/a.pdf' },
        { id: 2, applicationId: 3, fileUrl: '/uploads/b.pdf' },
      ];
      mockPrisma.document.findMany.mockResolvedValue(docs);
      const result = await service.findByApplication(3);
      expect(result).toHaveLength(2);
      expect(result[0].download_url).toBe('/api/v1/applications/3/documents/1/download');
      expect(result[1].download_url).toBe('/api/v1/applications/3/documents/2/download');
    });
    it('should return null download_url for docs without fileUrl', async () => {
      mockPrisma.document.findMany.mockResolvedValue([{ id: 1, applicationId: 1, fileUrl: null }]);
      const result = await service.findByApplication(1);
      expect(result[0].download_url).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a document with download_url', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, applicationId: 2, fileName: 'test.pdf', fileUrl: '/uploads/test.pdf' });
      const result = await service.findOne(1);
      expect(result.fileName).toBe('test.pdf');
      expect(result.download_url).toBe('/api/v1/applications/2/documents/1/download');
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
    it('should update to verified with download_url', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, rejectionNote: null });
      mockPrisma.document.update.mockResolvedValue({ id: 1, applicationId: 4, status: 'verified', fileUrl: '/uploads/x.pdf' });
      const result = await service.updateStatus(1, 'verified', 2);
      expect(result.status).toBe('verified');
      expect(result.download_url).toBe('/api/v1/applications/4/documents/1/download');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'verified', verifiedAt: expect.any(Date) }),
      });
    });
    it('should update to rejected with note', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, rejectionNote: null });
      mockPrisma.document.update.mockResolvedValue({ id: 1, applicationId: 1, status: 'rejected', fileUrl: '/uploads/x.pdf' });
      const result = await service.updateStatus(1, 'rejected', 2, 'Blurry image');
      expect(result.status).toBe('rejected');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ rejectionNote: 'Blurry image' }),
      });
    });
    it('should keep existing rejectionNote when not provided', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1, rejectionNote: 'Old note' });
      mockPrisma.document.update.mockResolvedValue({ id: 1, applicationId: 1, status: 'verified', fileUrl: '/uploads/x.pdf' });
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
