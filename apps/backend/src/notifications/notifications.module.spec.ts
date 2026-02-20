import { Test } from '@nestjs/testing';
import { NotificationsModule } from './notifications.module';
import { NotificationsService } from './notifications.service';

describe('NotificationsModule', () => {
  it('should compile and provide NotificationsService', async () => {
    const module = await Test.createTestingModule({
      imports: [NotificationsModule],
    }).compile();
    expect(module.get(NotificationsService)).toBeDefined();
  });
});
