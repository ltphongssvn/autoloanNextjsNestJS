// apps/backend/src/auth/auth.controller.spec.ts
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt.strategy';
import { Response } from 'express';

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis() as any,
    json: jest.fn().mockReturnThis() as any,
  };
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;

  const mockService = {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    confirmEmail: jest.fn(),
    resendConfirmation: jest.fn(),
    unlockAccount: jest.fn(),
    resendUnlock: jest.fn(),
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
    it('should set Authorization header and return token', async () => { // pragma: allowlist secret
      const data = { token: 'jwt', user: { id: 1 } }; // pragma: allowlist secret
      mockService.login.mockResolvedValue(data);
      const res = mockRes();
      await controller.login({ email: 'a@b.com', password: 'p' }, res as Response); // pragma: allowlist secret
      expect(res.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer jwt');
      expect(res.json).toHaveBeenCalledWith(data);
    });
  });

  describe('signup', () => {
    it('should set Authorization header and return 201', async () => {
      const data = { token: 'jwt', user: { id: 1 } }; // pragma: allowlist secret
      mockService.signup.mockResolvedValue(data);
      const res = mockRes();
      await controller.signup({ email: 'a@b.com', password: 'p', first_name: 'A', last_name: 'B' }, res as Response); // pragma: allowlist secret
      expect(res.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer jwt');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(data);
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
    it('should set Authorization header and return new token', async () => { // pragma: allowlist secret
      const data = { token: 'new-jwt', user: { id: 1 } }; // pragma: allowlist secret
      mockService.refresh.mockResolvedValue(data);
      const res = mockRes();
      await controller.refresh(authReq(), res as Response);
      expect(res.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer new-jwt');
      expect(res.json).toHaveBeenCalledWith(data);
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
      await controller.resendConfirmation({ email: 'a@b.com' });
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('a@b.com');
    });
    it('should resend with Devise-wrapped body', async () => {
      mockService.resendConfirmation.mockResolvedValue({ message: 'sent' });
      await controller.resendConfirmation({ user: { email: 'a@b.com' } });
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('a@b.com');
    });
    it('should fallback to empty string when no email provided', async () => {
      mockService.resendConfirmation.mockResolvedValue({ message: 'sent' });
      await controller.resendConfirmation({});
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('');
    });
    it('should fallback with empty user email', async () => {
      mockService.resendConfirmation.mockResolvedValue({ message: 'sent' });
      await controller.resendConfirmation({ user: { email: '' } });
      expect(mockService.resendConfirmation).toHaveBeenCalledWith('');
    });
  });

  describe('unlockAccount', () => {
    it('should unlock with token from query param', async () => {
      mockService.unlockAccount.mockResolvedValue({ message: 'Account unlocked successfully' });
      const result = await controller.unlockAccount('test-token');
      expect(mockService.unlockAccount).toHaveBeenCalledWith('test-token');
      expect(result.message).toBe('Account unlocked successfully');
    });
  });

  describe('resendUnlock', () => {
    it('should resend with flat body', async () => {
      mockService.resendUnlock.mockResolvedValue({ message: 'sent' });
      await controller.resendUnlock({ email: 'a@b.com' });
      expect(mockService.resendUnlock).toHaveBeenCalledWith('a@b.com');
    });
    it('should resend with Devise-wrapped body', async () => {
      mockService.resendUnlock.mockResolvedValue({ message: 'sent' });
      await controller.resendUnlock({ user: { email: 'a@b.com' } });
      expect(mockService.resendUnlock).toHaveBeenCalledWith('a@b.com');
    });
    it('should fallback to empty string when no email provided', async () => {
      mockService.resendUnlock.mockResolvedValue({ message: 'sent' });
      await controller.resendUnlock({});
      expect(mockService.resendUnlock).toHaveBeenCalledWith('');
    });
    it('should fallback with empty user email', async () => {
      mockService.resendUnlock.mockResolvedValue({ message: 'sent' });
      await controller.resendUnlock({ user: { email: '' } });
      expect(mockService.resendUnlock).toHaveBeenCalledWith('');
    });
  });

  describe('requestPasswordReset', () => { // pragma: allowlist secret
    it('should request reset with flat body', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      await controller.requestPasswordReset({ email: 'a@b.com' }); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith('a@b.com'); // pragma: allowlist secret
    });
    it('should request reset with Devise-wrapped body', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      await controller.requestPasswordReset({ user: { email: 'a@b.com' } }); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith('a@b.com'); // pragma: allowlist secret
    });
    it('should fallback to empty string when no email provided', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      await controller.requestPasswordReset({}); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith(''); // pragma: allowlist secret
    });
    it('should fallback with empty user email', async () => {
      mockService.requestPasswordReset.mockResolvedValue({ message: 'sent' }); // pragma: allowlist secret
      await controller.requestPasswordReset({ user: { email: '' } }); // pragma: allowlist secret
      expect(mockService.requestPasswordReset).toHaveBeenCalledWith(''); // pragma: allowlist secret
    });
  });

  describe('resetPassword', () => { // pragma: allowlist secret
    it('should reset password with flat body', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      await controller.resetPassword({ token: 'tok', password: 'new' }); // pragma: allowlist secret
      expect(mockService.resetPassword).toHaveBeenCalledWith('tok', 'new'); // pragma: allowlist secret
    });
    it('should reset password with Devise-wrapped body', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      await controller.resetPassword({ // pragma: allowlist secret
        user: { reset_password_token: 'tok', password: 'new', password_confirmation: 'new' }, // pragma: allowlist secret
      });
      expect(mockService.resetPassword).toHaveBeenCalledWith('tok', 'new'); // pragma: allowlist secret
    });
    it('should fallback to empty strings when no fields provided', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      await controller.resetPassword({}); // pragma: allowlist secret
      expect(mockService.resetPassword).toHaveBeenCalledWith('', ''); // pragma: allowlist secret
    });
    it('should fallback with empty user fields', async () => { // pragma: allowlist secret
      mockService.resetPassword.mockResolvedValue({ message: 'done' }); // pragma: allowlist secret
      await controller.resetPassword({ // pragma: allowlist secret
        user: { reset_password_token: '', password: '', password_confirmation: '' }, // pragma: allowlist secret
      });
      expect(mockService.resetPassword).toHaveBeenCalledWith('', ''); // pragma: allowlist secret
    });
  });
});
