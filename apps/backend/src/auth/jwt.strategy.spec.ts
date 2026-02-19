// apps/backend/src/auth/jwt.strategy.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { PrismaService } from '../prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;

  const mockPrisma = {
    jwtDenylist: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-for-unit-tests'; // pragma: allowlist secret
    prisma = mockPrisma as unknown as PrismaService;
    strategy = new JwtStrategy(prisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  const validPayload: JwtPayload = {
    sub: 1,
    email: 'test@example.com',
    role: 'customer',
    jti: 'unique-token-id',
  };

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return payload for valid token', async () => {
    mockPrisma.jwtDenylist.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

    const result = await strategy.validate(validPayload);
    expect(result).toEqual(validPayload);
    expect(mockPrisma.jwtDenylist.findFirst).toHaveBeenCalledWith({
      where: { jti: 'unique-token-id' },
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('should throw UnauthorizedException if token is revoked', async () => {
    mockPrisma.jwtDenylist.findFirst.mockResolvedValue({ id: 1, jti: 'unique-token-id' });

    await expect(strategy.validate(validPayload)).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate(validPayload)).rejects.toThrow('Token has been revoked');
  });

  it('should throw UnauthorizedException if user not found', async () => {
    mockPrisma.jwtDenylist.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(validPayload)).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate(validPayload)).rejects.toThrow('User not found');
  });
});
