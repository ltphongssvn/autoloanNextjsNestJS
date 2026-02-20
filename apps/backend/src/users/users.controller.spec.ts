// apps/backend/src/users/users.controller.spec.ts
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('UsersController', () => {
  let controller: UsersController;
  const mockService = { findById: jest.fn(), updateProfile: jest.fn() };
  const mockReq = () => ({
    user: { sub: 1, email: 'test@test.com', role: 'customer', jti: 'jti' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new UsersController(mockService as unknown as UsersService);
    jest.clearAllMocks();
  });

  it('should get profile', async () => {
    mockService.findById.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const result = await controller.getProfile(mockReq());
    expect(mockService.findById).toHaveBeenCalledWith(1);
    expect(result.email).toBe('test@test.com');
  });

  it('should update profile', async () => {
    mockService.updateProfile.mockResolvedValue({ id: 1, first_name: 'Jane' });
    const result = await controller.updateProfile(mockReq(), { first_name: 'Jane' });
    expect(mockService.updateProfile).toHaveBeenCalledWith(1, { first_name: 'Jane' });
    expect(result.first_name).toBe('Jane');
  });
});
