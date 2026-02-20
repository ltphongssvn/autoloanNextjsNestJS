import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email', async () => {
    const result = await service.sendEmail({ to: 'test@test.com', subject: 'Test', body: 'Hello' });
    expect(result).toBe(true);
  });

  it('should notify status change', async () => {
    const result = await service.notifyStatusChange('test@test.com', 'APP-001', 'submitted', 'under_review');
    expect(result).toBe(true);
  });

  it('should notify application submitted', async () => {
    const result = await service.notifyApplicationSubmitted('test@test.com', 'APP-001');
    expect(result).toBe(true);
  });

  it('should notify document uploaded', async () => {
    const result = await service.notifyDocumentUploaded('test@test.com', 'APP-001', 'drivers_license');
    expect(result).toBe(true);
  });

  it('should notify application approved', async () => {
    const result = await service.notifyApplicationApproved('test@test.com', 'APP-001');
    expect(result).toBe(true);
  });

  it('should notify application rejected', async () => {
    const result = await service.notifyApplicationRejected('test@test.com', 'APP-001');
    expect(result).toBe(true);
  });
});
