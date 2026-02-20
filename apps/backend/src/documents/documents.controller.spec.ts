// apps/backend/src/documents/documents.controller.spec.ts
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  const mockService = {
    upload: jest.fn(),
    findByApplication: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockReq = (sub = 1) => ({
    user: { sub, email: 'test@test.com', role: 'customer', jti: 'jti' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new DocumentsController(mockService as unknown as DocumentsService);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should call documentsService.upload', async () => {
      mockService.upload.mockResolvedValue({ id: 1 });
      const body = { fileName: 'test.pdf', docType: 'id_document', fileUrl: '/uploads/test.pdf', fileSize: 1024, contentType: 'application/pdf' };
      const result = await controller.upload(1, mockReq(), body);
      expect(result).toEqual({ id: 1 });
      expect(mockService.upload).toHaveBeenCalledWith(1, 1, 'test.pdf', 'id_document', '/uploads/test.pdf', 1024, 'application/pdf');
    });
  });

  describe('findByApplication', () => {
    it('should return documents', async () => {
      mockService.findByApplication.mockResolvedValue([{ id: 1 }]);
      const result = await controller.findByApplication(1);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('updateStatus', () => {
    it('should update document status', async () => {
      mockService.updateStatus.mockResolvedValue({ id: 1, status: 'approved' });
      const result = await controller.updateStatus(1, mockReq(2), 'approved');
      expect(mockService.updateStatus).toHaveBeenCalledWith(1, 'approved', 2);
      expect(result.status).toBe('approved');
    });
  });
});
