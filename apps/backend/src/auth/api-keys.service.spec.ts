import { Test } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  const mockPrisma = {
    apiKey: { findMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ApiKeysService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ApiKeysService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns user api keys', async () => {
      const keys = [{ id: 1, name: 'test', active: true }];
      mockPrisma.apiKey.findMany.mockResolvedValue(keys);
      expect(await service.list(1)).toEqual(keys);
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
    });
  });

  describe('create', () => {
    it('creates key and returns plain key', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({ id: 1, name: 'my key', active: true, expiresAt: null, createdAt: new Date() });
      const result = await service.create(1, 'my key');
      expect(result.key).toMatch(/^ak_/);
      expect(result.name).toBe('my key');
    });
    it('accepts optional expiresAt', async () => {
      const expires = new Date('2030-01-01');
      mockPrisma.apiKey.create.mockResolvedValue({ id: 1, name: 'k', active: true, expiresAt: expires, createdAt: new Date() });
      const result = await service.create(1, 'k', expires);
      expect(result.key).toMatch(/^ak_/);
    });
  });

  describe('revoke', () => {
    it('revokes an existing key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({ id: 1, userId: 1 });
      mockPrisma.apiKey.update.mockResolvedValue({});
      expect(await service.revoke(1, 1)).toEqual({ id: 1, active: false });
    });
    it('throws if key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.revoke(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes an existing key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({ id: 1, userId: 1 });
      mockPrisma.apiKey.delete.mockResolvedValue({});
      expect(await service.remove(1, 1)).toEqual({ deleted: true });
    });
    it('throws if key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('authenticate', () => {
    it('returns null for empty key', async () => {
      expect(await service.authenticate('')).toBeNull();
    });
    it('returns null if key not found', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      expect(await service.authenticate('ak_invalid')).toBeNull();
    });
    it('returns null if key inactive', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 1, active: false, user: {} });
      expect(await service.authenticate('ak_test')).toBeNull();
    });
    it('returns null if key expired', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 1, active: true, expiresAt: new Date('2020-01-01'), user: {} });
      expect(await service.authenticate('ak_test')).toBeNull();
    });
    it('returns key and updates lastUsedAt for valid key', async () => {
      const apiKey = { id: 1, active: true, expiresAt: null, user: { id: 1 } };
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);
      mockPrisma.apiKey.update.mockResolvedValue({});
      const result = await service.authenticate('ak_validkey');
      expect(result).toEqual(apiKey);
      expect(mockPrisma.apiKey.update).toHaveBeenCalled();
    });
    it('returns key when expiresAt is in the future', async () => {
      const apiKey = { id: 1, active: true, expiresAt: new Date('2099-01-01'), user: { id: 1 } };
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);
      mockPrisma.apiKey.update.mockResolvedValue({});
      expect(await service.authenticate('ak_future')).toEqual(apiKey);
    });
  });
});
