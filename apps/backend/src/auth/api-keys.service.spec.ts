// apps/backend/src/auth/api-keys.service.spec.ts
import { Test } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  const mockPrisma = {
    apiKey: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ApiKeysService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ApiKeysService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return user API keys', async () => {
      const keys = [{ id: 1, name: 'test', active: true }];
      mockPrisma.apiKey.findMany.mockResolvedValue(keys);
      const result = await service.list(1);
      expect(result).toEqual(keys);
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, active: true, expiresAt: true, lastUsedAt: true, createdAt: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single API key', async () => {
      const key = { id: 1, name: 'test', active: true, expiresAt: null, lastUsedAt: null, createdAt: new Date() };
      mockPrisma.apiKey.findFirst.mockResolvedValue(key);
      const result = await service.findOne(1, 1);
      expect(result).toEqual(key);
      expect(mockPrisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        select: { id: true, name: true, active: true, expiresAt: true, lastUsedAt: true, createdAt: true },
      });
    });
    it('should throw NotFoundException when key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.findOne(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return key with plain text', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({ id: 1, name: 'test', active: true });
      const result = await service.create(1, 'test');
      expect(result.key).toMatch(/^ak_/);
      expect(mockPrisma.apiKey.create).toHaveBeenCalled();
    });
    it('should accept expiresAt', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({ id: 1, name: 'test', active: true });
      const expires = new Date('2026-12-31');
      await service.create(1, 'test', expires);
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ expiresAt: expires }) }),
      );
    });
  });

  describe('revoke', () => {
    it('should revoke an API key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.apiKey.update.mockResolvedValue({});
      const result = await service.revoke(1, 1);
      expect(result).toEqual({ id: 1, active: false });
    });
    it('should throw NotFoundException when key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.revoke(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an API key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.apiKey.delete.mockResolvedValue({});
      const result = await service.remove(1, 1);
      expect(result).toEqual({ deleted: true });
    });
    it('should throw NotFoundException when key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('authenticate', () => {
    it('should return API key with user for valid key', async () => {
      const apiKey = { id: 1, active: true, expiresAt: null, user: { id: 1 } };
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);
      mockPrisma.apiKey.update.mockResolvedValue({});
      const result = await service.authenticate('ak_test123');
      expect(result).toEqual(apiKey);
    });
    it('should return null for empty key', async () => {
      const result = await service.authenticate('');
      expect(result).toBeNull();
    });
    it('should return null for inactive key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 1, active: false });
      const result = await service.authenticate('ak_test123');
      expect(result).toBeNull();
    });
    it('should return null for expired key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 1, active: true, expiresAt: new Date('2020-01-01'),
      });
      const result = await service.authenticate('ak_test123');
      expect(result).toBeNull();
    });
    it('should return null when key not found', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      const result = await service.authenticate('ak_invalid');
      expect(result).toBeNull();
    });
  });
});
