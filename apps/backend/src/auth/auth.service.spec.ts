// apps/backend/src/auth/auth.service.spec.ts
import { UnauthorizedException, ConflictException } from '@nestjs/common';
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
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    jwtDenylist: {
      create: jest.fn(),
    },
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
  };

  beforeEach(() => {
    service = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwt as unknown as JwtService,
    );
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return token and user on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login({ email: 'test@test.com', password: 'pass' }); // pragma: allowlist secret
      expect(result.token).toBe('signed-jwt-token'); // pragma: allowlist secret
      expect(result.user.email).toBe('test@test.com');
      expect(result.user.full_name).toBe('John Doe');
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'p' })).rejects.toThrow(UnauthorizedException); // pragma: allowlist secret
    });

    it('should throw on wrong password', async () => { // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException); // pragma: allowlist secret
    });
  });

  describe('signup', () => {
    it('should create user and return token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.signup({
        email: 'new@test.com',
        password: 'pass123', // pragma: allowlist secret
        first_name: 'John',
        last_name: 'Doe',
      });
      expect(result.token).toBe('signed-jwt-token'); // pragma: allowlist secret
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw when email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.signup({
        email: 'test@test.com',
        password: 'p', // pragma: allowlist secret
        first_name: 'A',
        last_name: 'B',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('logout', () => {
    it('should add jti to denylist', async () => {
      mockPrisma.jwtDenylist.create.mockResolvedValue({});
      await service.logout('some-jti');
      expect(mockPrisma.jwtDenylist.create).toHaveBeenCalledWith({ data: { jti: 'some-jti' } });
    });
  });
});
