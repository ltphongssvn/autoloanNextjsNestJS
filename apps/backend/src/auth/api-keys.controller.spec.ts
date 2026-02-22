// apps/backend/src/auth/api-keys.controller.spec.ts
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  const mockService = {
    list: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    revoke: jest.fn(),
    remove: jest.fn(),
  };
  const req = { user: { sub: 1 } };

  beforeEach(() => {
    controller = new ApiKeysController(mockService as unknown as ApiKeysService);
    jest.clearAllMocks();
  });

  it('should list keys', async () => {
    mockService.list.mockResolvedValue([{ id: 1 }]);
    const result = await controller.list(req);
    expect(mockService.list).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should find one key by id', async () => {
    const key = { id: 5, name: 'my-key', active: true };
    mockService.findOne.mockResolvedValue(key);
    const result = await controller.findOne(req, 5);
    expect(mockService.findOne).toHaveBeenCalledWith(1, 5);
    expect(result).toEqual(key);
  });

  it('should create a key', async () => {
    mockService.create.mockResolvedValue({ id: 1, key: 'ak_test' });
    const result = await controller.create(req, { name: 'test' });
    expect(mockService.create).toHaveBeenCalledWith(1, 'test', undefined);
    expect(result.key).toBe('ak_test');
  });

  it('should create a key with expires_at', async () => {
    mockService.create.mockResolvedValue({ id: 1 });
    await controller.create(req, { name: 'test', expires_at: '2026-12-31' });
    expect(mockService.create).toHaveBeenCalledWith(1, 'test', expect.any(Date));
  });

  it('should revoke a key', async () => {
    mockService.revoke.mockResolvedValue({ id: 1, active: false });
    const result = await controller.revoke(req, 1);
    expect(mockService.revoke).toHaveBeenCalledWith(1, 1);
    expect(result.active).toBe(false);
  });

  it('should remove a key', async () => {
    mockService.remove.mockResolvedValue({ deleted: true });
    const result = await controller.remove(req, 1);
    expect(mockService.remove).toHaveBeenCalledWith(1, 1);
    expect(result.deleted).toBe(true);
  });
});
