// apps/backend/src/applications/applications.controller.spec.ts
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { StatusHistoryService } from './status-history.service';
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
  const mockHistoryService = {
    findByApplication: jest.fn(),
  };

  const customerReq = () => ({
    user: { sub: 1, email: 'c@test.com', role: 'customer', jti: 'j' } as JwtPayload,
  });
  const staffReq = () => ({
    user: { sub: 2, email: 's@test.com', role: 'loan_officer', jti: 'j' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new ApplicationsController(
      mockService as unknown as ApplicationsService,
      mockHistoryService as unknown as StatusHistoryService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create application', async () => {
      mockService.create.mockResolvedValue({ id: 1 });
      const result = await controller.create(customerReq(), { loanAmount: 25000 });
      expect(mockService.create).toHaveBeenCalledWith(1, { loanAmount: 25000 });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('findAll', () => {
    it('should return user apps for customer', async () => {
      mockService.findAllForUser.mockResolvedValue([{ id: 1 }]);
      const result = await controller.findAll(customerReq());
      expect(mockService.findAllForUser).toHaveBeenCalledWith(1);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should return all apps for staff', async () => {
      mockService.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const result = await controller.findAll(staffReq());
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return single application', async () => {
      mockService.findOne.mockResolvedValue({ id: 1 });
      const req = customerReq();
      const result = await controller.findOne(1, req);
      expect(mockService.findOne).toHaveBeenCalledWith(1, 1, 'customer');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      mockService.updateStatus.mockResolvedValue({ id: 1, status: 'approved' });
      const result = await controller.updateStatus(1, staffReq(), { status: 'approved' });
      expect(mockService.updateStatus).toHaveBeenCalledWith(1, 'approved', 2);
      expect(result.status).toBe('approved');
    });
  });

  describe('getHistory', () => {
    it('should return status history', async () => {
      const history = [{ id: 1 }, { id: 2 }];
      mockHistoryService.findByApplication.mockResolvedValue(history);
      const result = await controller.getHistory(1);
      expect(mockHistoryService.findByApplication).toHaveBeenCalledWith(1);
      expect(result).toEqual(history);
    });
  });
});
