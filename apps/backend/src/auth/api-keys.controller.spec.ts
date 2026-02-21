import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  const mockService = { list: jest.fn(), create: jest.fn(), revoke: jest.fn(), remove: jest.fn() };
  const req = { user: { sub: 1 } };

  beforeEach(() => {
    controller = new ApiKeysController(mockService as unknown as ApiKeysService);
    jest.clearAllMocks();
  });

  it('list calls service', async () => {
    mockService.list.mockResolvedValue([{ id: 1 }]);
    expect(await controller.list(req)).toEqual([{ id: 1 }]);
    expect(mockService.list).toHaveBeenCalledWith(1);
  });

  it('create calls service with name', async () => {
    mockService.create.mockResolvedValue({ id: 1, key: 'ak_test' });
    expect(await controller.create(req, { name: 'test' })).toEqual({ id: 1, key: 'ak_test' });
    expect(mockService.create).toHaveBeenCalledWith(1, 'test', undefined);
  });

  it('create calls service with expires_at', async () => {
    mockService.create.mockResolvedValue({ id: 1, key: 'ak_test' });
    await controller.create(req, { name: 'test', expires_at: '2030-01-01' });
    expect(mockService.create).toHaveBeenCalledWith(1, 'test', new Date('2030-01-01'));
  });

  it('revoke calls service', async () => {
    mockService.revoke.mockResolvedValue({ id: 1, active: false });
    expect(await controller.revoke(req, 1)).toEqual({ id: 1, active: false });
    expect(mockService.revoke).toHaveBeenCalledWith(1, 1);
  });

  it('remove calls service', async () => {
    mockService.remove.mockResolvedValue({ deleted: true });
    expect(await controller.remove(req, 1)).toEqual({ deleted: true });
    expect(mockService.remove).toHaveBeenCalledWith(1, 1);
  });
});
