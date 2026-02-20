import { NotificationsModule, NotificationsService } from './index';

describe('Notifications barrel', () => {
  it('should export module and service', () => {
    expect(NotificationsModule).toBeDefined();
    expect(NotificationsService).toBeDefined();
  });
});
