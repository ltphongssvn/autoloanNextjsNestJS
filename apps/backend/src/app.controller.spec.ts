// apps/backend/src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    controller = module.get(AppController);
  });

  it('should return health from root', () => {
    const result = controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('should return health check with uptime', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(typeof result.uptime).toBe('number');
  });
});
