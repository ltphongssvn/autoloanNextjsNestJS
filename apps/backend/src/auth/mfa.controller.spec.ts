import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';

describe('MfaController', () => {
  let controller: MfaController;
  const mockService = {
    getStatus: jest.fn(),
    setup: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    verify: jest.fn(),
  };
  const req = { user: { sub: 1 } };

  beforeEach(() => {
    controller = new MfaController(mockService as unknown as MfaService);
    jest.clearAllMocks();
  });

  it('getStatus calls service', async () => {
    mockService.getStatus.mockResolvedValue({ mfa_enabled: true });
    expect(await controller.getStatus(req)).toEqual({ mfa_enabled: true });
    expect(mockService.getStatus).toHaveBeenCalledWith(1);
  });

  it('setup calls service', async () => {
    mockService.setup.mockResolvedValue({ secret: 's', otp_auth_url: 'url' }); // pragma: allowlist secret
    expect(await controller.setup(req)).toEqual({ secret: 's', otp_auth_url: 'url' }); // pragma: allowlist secret
    expect(mockService.setup).toHaveBeenCalledWith(1);
  });

  it('enable calls service with code', async () => {
    mockService.enable.mockResolvedValue({ mfa_enabled: true, backup_codes: [] });
    expect(await controller.enable(req, { code: '123456' })).toEqual({ mfa_enabled: true, backup_codes: [] });
    expect(mockService.enable).toHaveBeenCalledWith(1, '123456');
  });

  it('disable calls service with code', async () => {
    mockService.disable.mockResolvedValue({ mfa_enabled: false });
    expect(await controller.disable(req, { code: '123456' })).toEqual({ mfa_enabled: false });
    expect(mockService.disable).toHaveBeenCalledWith(1, '123456');
  });

  it('verify calls service with code', async () => {
    mockService.verify.mockResolvedValue({ valid: true });
    expect(await controller.verify(req, { code: '123456' })).toEqual({ valid: true });
    expect(mockService.verify).toHaveBeenCalledWith(1, '123456');
  });
});
