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
    it('should return keys with key_prefix and without keyDigest', async () => {
      const keys = [{ id: 1, name: 'test', active: true, expiresAt: null, lastUsedAt: null, createdAt: new Date(), keyDigest: 'abcdef1234567890' }]; // pragma: allowlist secret
      mockPrisma.apiKey.findMany.mockResolvedValue(keys);
      const result = await service.list(1);
      expect(result[0].key_prefix).toBe('abcdef12');
      expect((result[0] as any).keyDigest).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return key with key_prefix', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({
        id: 1, name: 'test', active: true, expiresAt: null, lastUsedAt: null, createdAt: new Date(), keyDigest: 'abcdef1234567890', // pragma: allowlist secret
      });
      const result = await service.findOne(1, 1);
      expect(result.key_prefix).toBe('abcdef12');
      expect((result as any).keyDigest).toBeUndefined();
    });
    it('should throw NotFoundException when key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.findOne(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should return key with plain text and key_prefix', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({ id: 1, name: 'test', active: true, expiresAt: null, createdAt: new Date(), keyDigest: 'abcdef1234567890' }); // pragma: allowlist secret
      const result = await service.create(1, 'test');
      expect(result.key).toMatch(/^ak_/);
      expect(result.key_prefix).toBe('abcdef12');
      expect((result as any).keyDigest).toBeUndefined();
    });
    it('should accept expiresAt', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({ id: 1, name: 'test', active: true, expiresAt: null, createdAt: new Date(), keyDigest: '1234567890abcdef' }); // pragma: allowlist secret
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
      expect(await service.authenticate('')).toBeNull();
    });
    it('should return null for inactive key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 1, active: false });
      expect(await service.authenticate('ak_test123')).toBeNull();
    });
    it('should return null for expired key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ id: 1, active: true, expiresAt: new Date('2020-01-01') });
      expect(await service.authenticate('ak_test123')).toBeNull();
    });
    it('should return null when key not found', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      expect(await service.authenticate('ak_invalid')).toBeNull();
    });
  });
});
