import { NotFoundException } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { PrismaService } from '../prisma.service';

class TestRepository extends BaseRepository<any> {
  protected readonly modelName = 'Test';
  constructor(prisma: PrismaService, delegate: any) {
    super(prisma, delegate);
  }
}

describe('BaseRepository', () => {
  let repo: TestRepository;
  let delegate: Record<string, jest.Mock>;
  const prisma = {} as PrismaService;

  beforeEach(() => {
    delegate = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    repo = new TestRepository(prisma, delegate);
  });

  describe('find', () => {
    it('should return record by id', async () => {
      delegate.findUnique.mockResolvedValue({ id: 1, name: 'test' });
      const result = await repo.find(1);
      expect(result).toEqual({ id: 1, name: 'test' });
      expect(delegate.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when not found', async () => {
      delegate.findUnique.mockResolvedValue(null);
      await expect(repo.find(999)).rejects.toThrow(NotFoundException);
      await expect(repo.find(999)).rejects.toThrow('Test with id 999 not found');
    });
  });

  describe('findBy', () => {
    it('should return first matching record', async () => {
      delegate.findFirst.mockResolvedValue({ id: 1 });
      const result = await repo.findBy({ email: 'test@test.com' });
      expect(result).toEqual({ id: 1 });
      expect(delegate.findFirst).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('should return null when no match', async () => {
      delegate.findFirst.mockResolvedValue(null);
      const result = await repo.findBy({ email: 'none@test.com' });
      expect(result).toBeNull();
    });
  });

  describe('all', () => {
    it('should return all records', async () => {
      delegate.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const result = await repo.all();
      expect(result).toHaveLength(2);
      expect(delegate.findMany).toHaveBeenCalledWith({});
    });

    it('should accept options', async () => {
      delegate.findMany.mockResolvedValue([]);
      await repo.all({ orderBy: { createdAt: 'desc' }, take: 5 });
      expect(delegate.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' }, take: 5 });
    });
  });

  describe('createRecord', () => {
    it('should create a record', async () => {
      delegate.create.mockResolvedValue({ id: 1, name: 'new' });
      const result = await repo.createRecord({ name: 'new' });
      expect(result).toEqual({ id: 1, name: 'new' });
      expect(delegate.create).toHaveBeenCalledWith({ data: { name: 'new' } });
    });
  });

  describe('updateRecord', () => {
    it('should update a record', async () => {
      delegate.update.mockResolvedValue({ id: 1, name: 'updated' });
      const result = await repo.updateRecord(1, { name: 'updated' });
      expect(result).toEqual({ id: 1, name: 'updated' });
      expect(delegate.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { name: 'updated' } });
    });
  });

  describe('destroy', () => {
    it('should delete a record', async () => {
      delegate.delete.mockResolvedValue({ id: 1 });
      const result = await repo.destroy(1);
      expect(result).toEqual({ id: 1 });
      expect(delegate.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      delegate.count.mockResolvedValue(1);
      expect(await repo.exists({ id: 1 })).toBe(true);
    });

    it('should return false when no record', async () => {
      delegate.count.mockResolvedValue(0);
      expect(await repo.exists({ id: 999 })).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all records', async () => {
      delegate.count.mockResolvedValue(5);
      expect(await repo.count()).toBe(5);
      expect(delegate.count).toHaveBeenCalledWith({});
    });

    it('should count with conditions', async () => {
      delegate.count.mockResolvedValue(2);
      expect(await repo.count({ status: 'active' })).toBe(2);
      expect(delegate.count).toHaveBeenCalledWith({ where: { status: 'active' } });
    });
  });
});
