// apps/backend/src/documents/documents.controller.spec.ts
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  const mockService = {
    upload: jest.fn(),
    findByApplication: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
  };
  const customerReq = () => ({
    user: { sub: 1, email: 'c@test.com', role: 'customer', jti: 'j' } as JwtPayload,
  });
  const staffReq = () => ({
    user: { sub: 2, email: 's@test.com', role: 'loan_officer', jti: 'j' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new DocumentsController(mockService as unknown as DocumentsService);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload a document', async () => {
      const file = { originalname: 'test.pdf' } as Express.Multer.File;
      mockService.upload.mockResolvedValue({ id: 1 });
      const result = await controller.upload(1, customerReq(), file, { doc_type: 'pay_stub' });
      expect(mockService.upload).toHaveBeenCalledWith(1, 1, file, 'pay_stub');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('findByApplication', () => {
    it('should list documents', async () => {
      mockService.findByApplication.mockResolvedValue([{ id: 1 }]);
      const result = await controller.findByApplication(1);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('findOne', () => {
    it('should return single document', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, fileName: 'test.pdf' });
      const result = await controller.findOne(1);
      expect(result.fileName).toBe('test.pdf');
    });
  });

  describe('remove', () => {
    it('should delete document', async () => {
      mockService.remove.mockResolvedValue({ message: 'Document deleted' });
      const result = await controller.remove(1, customerReq());
      expect(mockService.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ message: 'Document deleted' });
    });
  });

  describe('download', () => {
    it('should redirect to fileUrl', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, fileUrl: '/uploads/test.pdf' });
      const res = { redirect: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.download(1, res as any);
      expect(res.redirect).toHaveBeenCalledWith('/uploads/test.pdf');
    });
    it('should return 404 when no fileUrl', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, fileUrl: null });
      const res = { redirect: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
      await controller.download(1, res as any);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'File not available' });
    });
  });

  describe('updateStatus', () => {
    it('should update document status', async () => {
      mockService.updateStatus.mockResolvedValue({ id: 1, status: 'verified' });
      const result = await controller.updateStatus(1, staffReq(), { status: 'verified' });
      expect(mockService.updateStatus).toHaveBeenCalledWith(1, 'verified', 2, undefined);
      expect(result.status).toBe('verified');
    });
  });
});
