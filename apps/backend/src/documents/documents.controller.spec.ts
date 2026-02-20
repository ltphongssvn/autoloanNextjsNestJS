// apps/backend/src/documents/documents.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

const mockReq = (sub: number, role: string) => ({
  user: { sub, email: 'test@example.com', role, jti: 'test-jti' },
});

describe('DocumentsController', () => {
  let controller: DocumentsController;
  const mockService = {
    upload: jest.fn(),
    findByApplication: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: mockService }],
    }).compile();
    controller = module.get(DocumentsController);
    jest.clearAllMocks();
  });

  it('should upload a document', async () => {
    const file = { originalname: 'test.pdf', size: 1024, mimetype: 'application/pdf' } as Express.Multer.File;
    mockService.upload.mockResolvedValue({ id: 1, fileName: 'test.pdf' });
    const result = await controller.upload(1, mockReq(1, 'customer'), file, { doc_type: 'drivers_license' });
    expect(mockService.upload).toHaveBeenCalledWith(1, 1, file, 'drivers_license');
    expect(result).toEqual({ id: 1, fileName: 'test.pdf' });
  });

  it('should find documents by application', async () => {
    mockService.findByApplication.mockResolvedValue([{ id: 1 }]);
    const result = await controller.findByApplication(1);
    expect(mockService.findByApplication).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should update document status', async () => {
    mockService.updateStatus.mockResolvedValue({ id: 1, status: 'verified' });
    const result = await controller.updateStatus(1, mockReq(2, 'loan_officer'), { status: 'verified' });
    expect(mockService.updateStatus).toHaveBeenCalledWith(1, 'verified', 2, undefined);
    expect(result).toEqual({ id: 1, status: 'verified' });
  });

  it('should pass rejection_note on reject', async () => {
    mockService.updateStatus.mockResolvedValue({ id: 1, status: 'rejected' });
    await controller.updateStatus(1, mockReq(2, 'loan_officer'), { status: 'rejected', rejection_note: 'Blurry' });
    expect(mockService.updateStatus).toHaveBeenCalledWith(1, 'rejected', 2, 'Blurry');
  });
});
