// apps/backend/src/repositories/base.repository.ts
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export abstract class BaseRepository<TDelegate extends {
  findUnique: (...args: any[]) => any;
  findFirst: (...args: any[]) => any;
  findMany: (...args: any[]) => any;
  create: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
  count: (...args: any[]) => any;
}> {
  protected abstract readonly modelName: string;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: TDelegate,
  ) {}

  async find(id: number) {
    const record = await this.delegate.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`${this.modelName} with id ${id} not found`);
    return record;
  }

  async findBy(where: Record<string, unknown>) {
    return this.delegate.findFirst({ where });
  }

  async all(options?: { orderBy?: Record<string, string>; take?: number; skip?: number }) {
    return this.delegate.findMany(options ?? {});
  }

  async createRecord(data: Record<string, unknown>) {
    return this.delegate.create({ data });
  }

  async updateRecord(id: number, data: Record<string, unknown>) {
    return this.delegate.update({ where: { id }, data });
  }

  async destroy(id: number) {
    return this.delegate.delete({ where: { id } });
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await this.delegate.count({ where });
    return count > 0;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.delegate.count(where ? { where } : {});
  }
}
