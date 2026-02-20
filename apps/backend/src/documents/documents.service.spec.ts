// apps/backend/src/documents/documents.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const mockPrisma = {
    application: { findUnique: jest.fn() },
    document: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(DocumentsService);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    const file = { originalname: 'test.pdf', filename: 'abc123.pdf', size: 1024, mimetype: 'application/pdf' } as Express.Multer.File;

    it('should upload a document', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.create.mockResolvedValue({ id: 1, fileName: 'test.pdf' });
      const result = await service.upload(1, 1, file, 'drivers_license');
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ applicationId: 1, docType: 'drivers_license', fileName: 'test.pdf', fileUrl: '/uploads/abc123.pdf', fileSize: 1024, contentType: 'application/pdf', status: 'pending' }),
      });
      expect(result).toEqual({ id: 1, fileName: 'test.pdf' });
    });

    it('should throw if no file', async () => {
      await expect(service.upload(1, 1, null as unknown as Express.Multer.File, 'other')).rejects.toThrow(BadRequestException);
    });

    it('should throw if application not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.upload(999, 1, file, 'other')).rejects.toThrow(NotFoundException);
    });

    it('should fallback to originalname when filename missing', async () => {
      const noFilename = { originalname: 'test.pdf', size: 512, mimetype: 'application/pdf' } as Express.Multer.File;
      mockPrisma.application.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.create.mockResolvedValue({ id: 2 });
      await service.upload(1, 1, noFilename, 'other');
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ fileUrl: '/uploads/test.pdf' }),
      });
    });
  });

  describe('findByApplication', () => {
    it('should return documents', async () => {
      mockPrisma.document.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await service.findByApplication(1);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('updateStatus', () => {
    it('should verify a document', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.update.mockResolvedValue({ id: 1, status: 'verified' });
      const result = await service.updateStatus(1, 'verified', 2);
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'verified', verifiedAt: expect.any(Date), verifiedById: 2 }),
      });
      expect(result).toEqual({ id: 1, status: 'verified' });
    });

    it('should reject a document with note', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.update.mockResolvedValue({ id: 1, status: 'rejected' });
      await service.updateStatus(1, 'rejected', 2, 'Blurry image');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'rejected', rejectionNote: 'Blurry image' }),
      });
    });

    it('should throw if document not found', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus(999, 'verified', 2)).rejects.toThrow(NotFoundException);
    });

    it('should set rejectionNote to null when not provided', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.document.update.mockResolvedValue({ id: 1, status: 'verified' });
      await service.updateStatus(1, 'verified', 2);
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ rejectionNote: null }),
      });
    });
  });
});
