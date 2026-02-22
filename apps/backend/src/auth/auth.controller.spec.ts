// apps/backend/src/auth/auth.controller.spec.ts
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt.strategy';

describe('AuthController', () => {
  let controller: AuthController;

  const mockService = {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    confirmEmail: jest.fn(),
    resendConfirmation: jest.fn(),
    requestPasswordReset: jest.fn(), // pragma: allowlist secret
    resetPassword: jest.fn(), // pragma: allowlist secret
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const authReq = () => ({
    user: { sub: 1, email: 'test@test.com', role: 'customer', jti: 'test-jti' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new AuthController(
      mockService as unknown as AuthService,
      mockUsersService as unknown as UsersService,
    );
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      const user = { id: 1, email: 'test@test.com', role: 'customer', first_name: 'Test', last_name: 'User' };
      mockUsersService.findById.mockResolvedValue(user);
      const result = await controller.getMe(authReq());
      expect(mockUsersService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });
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

  describe('confirmEmail', () => {
    it('should confirm email with token from query param', async () => {
      mockService.confirmEmail.mockResolvedValue({ message: 'Email confirmed successfully' });
      const result = await controller.confirmEmail('test-token');
      expect(mockService.confirmEmail).toHaveBeenCalledWith('test-token');
      expect(result.message).toBe('Email confirmed successfully');
    });
  });

  describe('resendConfirmation', () => {
    it('should resend with flat body', async () => {
      mockService.resendConfirmation.mockResolvedValue({ message: 'sent' });
      const result = await controller.resendConfirmation({ email: 'a@b.com' });
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('a@b.com');
    });
    it('should resend with Devise-wrapped body', async () => {
      mockService.resendConfirmation.mockResolvedValue({ message: 'sent' });
      const result = await controller.resendConfirmation({ user: { email: 'a@b.com' } });
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('a@b.com');
    });
    it('should fallback to empty string when no email provided', async () => {
      mockService.resendConfirmation.mockResolvedValue({ message: 'sent' });
      await controller.resendConfirmation({});
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('');
    });
    it('should fallback to empty string with empty user object', async () => {
      mockService.resendConfirmation.mockResolvedValue({ message: 'sent' });
      await controller.resendConfirmation({ user: { email: '' } });
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('');
    });
  });

  describe('requestPasswordReset', () => { // pragma: allowlist secret
    it('should request reset with flat body', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      const result = await controller.requestPasswordReset({ email: 'a@b.com' }); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith('a@b.com'); // pragma: allowlist secret
      expect(result.message).toBe('sent');
    });
    it('should request reset with Devise-wrapped body', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      const result = await controller.requestPasswordReset({ user: { email: 'a@b.com' } }); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith('a@b.com'); // pragma: allowlist secret
      expect(result.message).toBe('sent');
    });
    it('should fallback to empty string when no email provided', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      await controller.requestPasswordReset({}); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith(''); // pragma: allowlist secret
    });
    it('should fallback to empty string with empty user object', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      await controller.requestPasswordReset({ user: { email: '' } }); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith(''); // pragma: allowlist secret
    });
  });

  describe('resetPassword', () => { // pragma: allowlist secret
    it('should reset password with flat body', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      const result = await controller.resetPassword({ token: 'tok', password: 'new' }); // pragma: allowlist secret
      expect(mockService.resetPassword).toHaveBeenCalledWith('tok', 'new'); // pragma: allowlist secret
      expect(result.message).toBe('done');
    });
    it('should reset password with Devise-wrapped body', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      const result = await controller.resetPassword({ // pragma: allowlist secret
        user: { reset_password_token: 'tok', password: 'new', password_confirmation: 'new' }, // pragma: allowlist secret
      });
      expect(mockService.resetPassword).toHaveBeenCalledWith('tok', 'new'); // pragma: allowlist secret
      expect(result.message).toBe('done');
    });
    it('should fallback to empty strings when no fields provided', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      await controller.resetPassword({}); // pragma: allowlist secret
      expect(mockService.resetPassword).toHaveBeenCalledWith('', ''); // pragma: allowlist secret
    });
    it('should fallback to empty strings with empty user object', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      await controller.resetPassword({ // pragma: allowlist secret
        user: { reset_password_token: '', password: '', password_confirmation: '' }, // pragma: allowlist secret
      });
      expect(mockService.resetPassword).toHaveBeenCalledWith('', ''); // pragma: allowlist secret
    });
  });
});
