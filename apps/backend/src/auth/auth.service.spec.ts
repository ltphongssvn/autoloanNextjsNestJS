// apps/backend/src/auth/auth.service.spec.ts
import { UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-pw'), // pragma: allowlist secret
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));
const bcrypt = require('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    jwtDenylist: { create: jest.fn() },
  };
  const mockJwt = {
    sign: jest.fn().mockReturnValue('signed-jwt-token'), // pragma: allowlist secret
  };
  const mockUser = {
    id: 1,
    email: 'test@test.com',
    encryptedPassword: 'hashed', // pragma: allowlist secret
    role: 'customer',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-0100',
    createdAt: new Date('2025-01-01'),
    confirmedAt: null,
    confirmationToken: null,
    failedAttempts: 0,
    lockedAt: null,
    unlockToken: null,
  };

  beforeEach(() => {
    service = new AuthService(mockPrisma as unknown as PrismaService, mockJwt as unknown as JwtService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return token and user on valid credentials', async () => { // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      const result = await service.login({ email: 'test@test.com', password: 'pass' }); // pragma: allowlist secret
      expect(result.token).toBe('signed-jwt-token'); // pragma: allowlist secret
      expect(result.user.email).toBe('test@test.com');
    });
    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'p' })).rejects.toThrow(UnauthorizedException); // pragma: allowlist secret
    });
    it('should throw on wrong password and increment failed attempts', async () => { // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, failedAttempts: 0 });
      bcrypt.compare.mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({});
      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException); // pragma: allowlist secret
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { failedAttempts: 1 },
      });
    });
    it('should lock account after 5 failed attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, failedAttempts: 4 });
      bcrypt.compare.mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({});
      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(ForbiddenException); // pragma: allowlist secret
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { failedAttempts: 5, lockedAt: expect.any(Date), unlockToken: 'test-uuid' },
      });
    });
    it('should throw ForbiddenException for locked account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, lockedAt: new Date() });
      await expect(service.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(ForbiddenException); // pragma: allowlist secret
    });
    it('should reset failed attempts on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, failedAttempts: 3 });
      bcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      await service.login({ email: 'test@test.com', password: 'pass' }); // pragma: allowlist secret
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { failedAttempts: 0 },
      });
    });
    it('should not update when failedAttempts is already 0', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, failedAttempts: 0 });
      bcrypt.compare.mockResolvedValue(true);
      await service.login({ email: 'test@test.com', password: 'pass' }); // pragma: allowlist secret
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('signup', () => {
    it('should create user with confirmation token and return token', async () => { // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      const result = await service.signup({
        email: 'new@test.com', password: 'pass123', first_name: 'John', last_name: 'Doe', // pragma: allowlist secret
      });
      expect(result.token).toBe('signed-jwt-token'); // pragma: allowlist secret
      expect(result.confirmation_token).toBe('test-uuid');
    });
    it('should throw when email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.signup({
        email: 'test@test.com', password: 'p', first_name: 'A', last_name: 'B', // pragma: allowlist secret
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email with valid token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, confirmationToken: 'tok', confirmedAt: null });
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.confirmEmail('tok');
      expect(result.message).toBe('Email confirmed successfully');
    });
    it('should throw for invalid token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.confirmEmail('bad')).rejects.toThrow(NotFoundException);
    });
    it('should return already confirmed message', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, confirmationToken: 'tok', confirmedAt: new Date() });
      const result = await service.confirmEmail('tok');
      expect(result.message).toBe('Email already confirmed');
    });
  });

  describe('resendConfirmation', () => {
    it('should generate new confirmation token for unconfirmed user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, confirmedAt: null });
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.resendConfirmation('test@test.com');
      expect(result.confirmation_token).toBe('test-uuid');
    });
    it('should return success for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.resendConfirmation('none@test.com');
      expect(result.message).toContain('If the email exists');
    });
    it('should return already confirmed for confirmed user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, confirmedAt: new Date() });
      const result = await service.resendConfirmation('test@test.com');
      expect(result.message).toBe('Email already confirmed');
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account with valid token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, unlockToken: 'tok', lockedAt: new Date(), failedAttempts: 5 });
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.unlockAccount('tok');
      expect(result.message).toBe('Account unlocked successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lockedAt: null, unlockToken: null, failedAttempts: 0 },
      });
    });
    it('should throw for invalid unlock token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.unlockAccount('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resendUnlock', () => {
    it('should generate new unlock token for locked user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, lockedAt: new Date() });
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.resendUnlock('test@test.com');
      expect(result.unlock_token).toBe('test-uuid');
    });
    it('should return success for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.resendUnlock('none@test.com');
      expect(result.message).toContain('If the account exists');
    });
    it('should return not locked for unlocked user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, lockedAt: null });
      const result = await service.resendUnlock('test@test.com');
      expect(result.message).toBe('Account is not locked');
    });
  });

  describe('logout', () => {
    it('should add jti to denylist', async () => {
      mockPrisma.jwtDenylist.create.mockResolvedValue({});
      await service.logout('some-jti');
      expect(mockPrisma.jwtDenylist.create).toHaveBeenCalledWith({ data: { jti: 'some-jti' } });
    });
  });

  describe('refresh', () => {
    it('should invalidate old token and return new one', async () => { // pragma: allowlist secret
      mockPrisma.jwtDenylist.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.refresh(1, 'old-jti');
      expect(result.token).toBe('signed-jwt-token'); // pragma: allowlist secret
    });
    it('should throw when user not found', async () => {
      mockPrisma.jwtDenylist.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.refresh(99, 'jti')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => { // pragma: allowlist secret
    it('should generate reset token for existing user', async () => { // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.requestPasswordReset('test@test.com'); // pragma: allowlist secret
      expect(result.reset_token).toBe('test-uuid'); // pragma: allowlist secret
    });
    it('should return success even for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.requestPasswordReset('none@test.com'); // pragma: allowlist secret
      expect(result.message).toContain('If the email exists');
    });
  });

  describe('resetPassword', () => { // pragma: allowlist secret
    it('should reset password with valid token', async () => { // pragma: allowlist secret
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, resetPasswordToken: 'tok', resetPasswordSentAt: new Date() }); // pragma: allowlist secret
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.resetPassword('tok', 'newpass'); // pragma: allowlist secret
      expect(result.message).toBe('Password reset successfully'); // pragma: allowlist secret
    });
    it('should throw for invalid token', async () => { // pragma: allowlist secret
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword('bad', 'newpass')).rejects.toThrow(NotFoundException); // pragma: allowlist secret
    });
    it('should throw for expired token (>24h)', async () => { // pragma: allowlist secret
      const expired = new Date(Date.now() - 25 * 60 * 60 * 1000);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, resetPasswordToken: 'tok', resetPasswordSentAt: expired }); // pragma: allowlist secret
      await expect(service.resetPassword('tok', 'newpass')).rejects.toThrow(UnauthorizedException); // pragma: allowlist secret
    });
    it('should allow reset when resetPasswordSentAt is null', async () => { // pragma: allowlist secret
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, resetPasswordToken: 'tok', resetPasswordSentAt: null }); // pragma: allowlist secret
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.resetPassword('tok', 'newpass'); // pragma: allowlist secret
      expect(result.message).toBe('Password reset successfully'); // pragma: allowlist secret
    });
  });
});
