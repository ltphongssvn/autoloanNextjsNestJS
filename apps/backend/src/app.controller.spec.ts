// apps/backend/src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return status ok with a timestamp', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return a valid ISO timestamp', () => {
      const result = appController.getHealth();
      const parsed = new Date(result.timestamp);
      expect(parsed.toISOString()).toBe(result.timestamp);
    });
  });
});
