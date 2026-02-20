// apps/backend/src/users/users.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  const mockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
  };

  const mockUser = {
    id: 1, email: 'test@test.com', role: 'customer',
    firstName: 'John', lastName: 'Doe', phone: '555-0100',
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    service = new UsersService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return formatted user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById(1);
      expect(result.full_name).toBe('John Doe');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, firstName: 'Jane' });
      const result = await service.updateProfile(1, { first_name: 'Jane' });
      expect(result.first_name).toBe('Jane');
      expect(result.full_name).toBe('Jane Doe');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateProfile(99, {})).rejects.toThrow(NotFoundException);
    });
  });
});
