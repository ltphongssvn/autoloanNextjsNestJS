// apps/backend/src/auth/auth.controller.spec.ts
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtPayload } from './jwt.strategy';

describe('AuthController', () => {
  let controller: AuthController;
  const mockService = {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    requestPasswordReset: jest.fn(), // pragma: allowlist secret
    resetPassword: jest.fn(), // pragma: allowlist secret
  };
  const authReq = () => ({
    user: { sub: 1, email: 'test@test.com', role: 'customer', jti: 'test-jti' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new AuthController(mockService as unknown as AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return token', async () => { // pragma: allowlist secret
      mockService.login.mockResolvedValue({ token: 'jwt' }); // pragma: allowlist secret
      const result = await controller.login({ email: 'a@b.com', password: 'p' }); // pragma: allowlist secret
      expect(mockService.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'p' }); // pragma: allowlist secret
      expect(result.token).toBe('jwt'); // pragma: allowlist secret
    });
  });

  describe('signup', () => {
    it('should create user', async () => {
      mockService.signup.mockResolvedValue({ token: 'jwt' }); // pragma: allowlist secret
      const result = await controller.signup({ email: 'a@b.com', password: 'p', first_name: 'A', last_name: 'B' }); // pragma: allowlist secret
      expect(result.token).toBe('jwt'); // pragma: allowlist secret
    });
  });

  describe('logout', () => {
    it('should invalidate token', async () => { // pragma: allowlist secret
      mockService.logout.mockResolvedValue(undefined);
      await controller.logout(authReq());
      expect(mockService.logout).toHaveBeenCalledWith('test-jti');
    });
  });

  describe('refresh', () => {
    it('should return new token', async () => { // pragma: allowlist secret
      mockService.refresh.mockResolvedValue({ token: 'new-jwt' }); // pragma: allowlist secret
      const result = await controller.refresh(authReq());
      expect(mockService.refresh).toHaveBeenCalledWith(1, 'test-jti');
      expect(result.token).toBe('new-jwt'); // pragma: allowlist secret
    });
  });

  describe('requestPasswordReset', () => { // pragma: allowlist secret
    it('should request reset', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      const result = await controller.requestPasswordReset({ email: 'a@b.com' }); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith('a@b.com'); // pragma: allowlist secret
      expect(result.message).toBe('sent');
    });
  });

  describe('resetPassword', () => { // pragma: allowlist secret
    it('should reset password', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      const result = await controller.resetPassword({ token: 'tok', password: 'new' }); // pragma: allowlist secret
      expect(mockService.resetPassword).toHaveBeenCalledWith('tok', 'new'); // pragma: allowlist secret
      expect(result.message).toBe('done');
    });
  });
});
