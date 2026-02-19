// apps/backend/src/app.service.spec.ts
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return status ok', () => {
      const result = service.getHealth();
      expect(result.status).toBe('ok');
    });

    it('should return a valid ISO timestamp', () => {
      const before = new Date().toISOString();
      const result = service.getHealth();
      const after = new Date().toISOString();
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });
  });
});
