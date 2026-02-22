// apps/backend/src/auth/api-keys.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

const KEY_PREFIX = 'ak_';
const KEY_LENGTH = 32;

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private digest(plainKey: string): string {
    return crypto.createHash('sha256').update(plainKey).digest('hex');
  }

  private generateKey(): string {
    return `${KEY_PREFIX}${crypto.randomBytes(KEY_LENGTH).toString('hex')}`;
  }

  private formatKey(key: any) {
    return { ...key, key_prefix: key.keyDigest?.slice(0, 8) || null };
  }

  async list(userId: number) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, active: true, expiresAt: true, lastUsedAt: true, createdAt: true, keyDigest: true },
    });
    return keys.map((k) => {
      const { keyDigest, ...rest } = k;
      return { ...rest, key_prefix: keyDigest.slice(0, 8) };
    });
  }

  async findOne(userId: number, keyId: number) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
      select: { id: true, name: true, active: true, expiresAt: true, lastUsedAt: true, createdAt: true, keyDigest: true },
    });
    if (!apiKey) throw new NotFoundException('API key not found');
    const { keyDigest, ...rest } = apiKey;
    return { ...rest, key_prefix: keyDigest.slice(0, 8) };
  }

  async create(userId: number, name: string, expiresAt?: Date) {
    const plainKey = this.generateKey();
    const keyDigest = this.digest(plainKey);
    const apiKey = await this.prisma.apiKey.create({
      data: { name, keyDigest, userId, expiresAt: expiresAt || null },
      select: { id: true, name: true, active: true, expiresAt: true, createdAt: true, keyDigest: true },
    });
    const { keyDigest: digest, ...rest } = apiKey;
    return { ...rest, key: plainKey, key_prefix: digest.slice(0, 8) };
  }

  async revoke(userId: number, keyId: number) {
    const apiKey = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!apiKey) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id: keyId }, data: { active: false } });
    return { id: keyId, active: false };
  }

  async remove(userId: number, keyId: number) {
    const apiKey = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!apiKey) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.delete({ where: { id: keyId } });
    return { deleted: true };
  }

  async authenticate(plainKey: string) {
    if (!plainKey) return null;
    const keyDigest = this.digest(plainKey);
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyDigest },
      include: { user: true },
    });
    if (!apiKey || !apiKey.active) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    return apiKey;
  }
}
