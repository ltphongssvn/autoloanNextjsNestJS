// apps/backend/src/auth/auth.controller.spec.ts
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const mockService = {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    controller = new AuthController(mockService as unknown as AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const result = { token: 'jwt', user: { id: 1 } }; // pragma: allowlist secret
      mockService.login.mockResolvedValue(result);
      const res = await controller.login({ email: 'a@b.com', password: 'p' }); // pragma: allowlist secret
      expect(res).toEqual(result);
      expect(mockService.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'p' }); // pragma: allowlist secret
    });
  });

  describe('signup', () => {
    it('should call authService.signup', async () => {
      const result = { token: 'jwt', user: { id: 2 } }; // pragma: allowlist secret
      mockService.signup.mockResolvedValue(result);
      const body = { email: 'n@b.com', password: 'p', first_name: 'A', last_name: 'B' }; // pragma: allowlist secret
      const res = await controller.signup(body);
      expect(res).toEqual(result);
      expect(mockService.signup).toHaveBeenCalledWith(body);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with jti', async () => {
      mockService.logout.mockResolvedValue(undefined);
      const req = { user: { sub: 1, email: 'a@b.com', role: 'customer', jti: 'token-jti' } };
      await controller.logout(req);
      expect(mockService.logout).toHaveBeenCalledWith('token-jti');
    });
  });
});
