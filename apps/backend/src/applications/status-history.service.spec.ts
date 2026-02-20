// apps/backend/src/applications/status-history.service.spec.ts
import { StatusHistoryService } from './status-history.service';
import { PrismaService } from '../prisma.service';

describe('StatusHistoryService', () => {
  let service: StatusHistoryService;
  const mockPrisma = {
    statusHistory: { findMany: jest.fn() },
  };

  beforeEach(() => {
    service = new StatusHistoryService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  describe('findByApplication', () => {
    it('should return status history for application', async () => {
      const history = [
        { id: 1, fromStatus: 'draft', toStatus: 'submitted' },
        { id: 2, fromStatus: 'submitted', toStatus: 'under_review' },
      ];
      mockPrisma.statusHistory.findMany.mockResolvedValue(history);
      const result = await service.findByApplication(1);
      expect(result).toEqual(history);
      expect(mockPrisma.statusHistory.findMany).toHaveBeenCalledWith({
        where: { applicationId: 1 },
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });
    });

    it('should return empty array when no history', async () => {
      mockPrisma.statusHistory.findMany.mockResolvedValue([]);
      const result = await service.findByApplication(99);
      expect(result).toEqual([]);
    });
  });
});
