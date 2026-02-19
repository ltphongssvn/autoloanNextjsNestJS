// apps/backend/src/applications/applications.controller.spec.ts
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  const mockService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockReq = (role: string, sub = 1) => ({
    user: { sub, email: 'test@test.com', role, jti: 'jti-123' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new ApplicationsController(mockService as unknown as ApplicationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create application for customer', async () => {
      mockService.create.mockResolvedValue({ id: 1 });
      const result = await controller.create(mockReq('customer'), { loanAmount: 25000 });
      expect(result).toEqual({ id: 1 });
      expect(mockService.create).toHaveBeenCalledWith(1, { loanAmount: 25000 });
    });
  });

  describe('findAll', () => {
    it('should return user apps for customer', async () => {
      mockService.findAllForUser.mockResolvedValue([{ id: 1 }]);
      const result = await controller.findAll(mockReq('customer'));
      expect(mockService.findAllForUser).toHaveBeenCalledWith(1);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should return all apps for loan_officer', async () => {
      mockService.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const result = await controller.findAll(mockReq('loan_officer'));
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return all apps for underwriter', async () => {
      mockService.findAll.mockResolvedValue([]);
      const result = await controller.findAll(mockReq('underwriter'));
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single application', async () => {
      mockService.findOne.mockResolvedValue({ id: 1 });
      const result = await controller.findOne(mockReq('customer'), 1);
      expect(mockService.findOne).toHaveBeenCalledWith(1, 1, 'customer');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('updateStatus', () => {
    it('should update application status', async () => {
      mockService.updateStatus.mockResolvedValue({ id: 1, status: 'approved' });
      const result = await controller.updateStatus(mockReq('underwriter'), 1, 'approved');
      expect(mockService.updateStatus).toHaveBeenCalledWith(1, 'approved', 1);
      expect(result.status).toBe('approved');
    });
  });
});
