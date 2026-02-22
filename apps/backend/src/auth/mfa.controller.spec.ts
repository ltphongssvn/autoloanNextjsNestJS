// apps/backend/src/auth/mfa.controller.spec.ts
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

  describe('getStatus', () => {
    it('should return MFA status', async () => {
      mockService.getStatus.mockResolvedValue({ mfa_enabled: false });
      const result = await controller.getStatus(req);
      expect(mockService.getStatus).toHaveBeenCalledWith(1);
      expect(result).toEqual({ mfa_enabled: false });
    });
  });

  describe('setup', () => {
    it('should return setup data', async () => {
      mockService.setup.mockResolvedValue({ secret: 's', otp_auth_url: 'u', qr_code_svg: '<svg/>' }); // pragma: allowlist secret
      const result = await controller.setup(req);
      expect(mockService.setup).toHaveBeenCalledWith(1);
      expect(result.qr_code_svg).toBe('<svg/>');
    });
  });

  describe('enable', () => {
    it('should accept otp_code field', async () => {
      mockService.enable.mockResolvedValue({ mfa_enabled: true });
      await controller.enable(req, { otp_code: '123456' });
      expect(mockService.enable).toHaveBeenCalledWith(1, '123456');
    });
    it('should accept code field', async () => {
      mockService.enable.mockResolvedValue({ mfa_enabled: true });
      await controller.enable(req, { code: '654321' });
      expect(mockService.enable).toHaveBeenCalledWith(1, '654321');
    });
    it('should prefer otp_code over code', async () => {
      mockService.enable.mockResolvedValue({ mfa_enabled: true });
      await controller.enable(req, { otp_code: '111111', code: '222222' });
      expect(mockService.enable).toHaveBeenCalledWith(1, '111111');
    });
    it('should fallback to empty string', async () => {
      mockService.enable.mockResolvedValue({ mfa_enabled: true });
      await controller.enable(req, {});
      expect(mockService.enable).toHaveBeenCalledWith(1, '');
    });
  });

  describe('disableDelete (DELETE /auth/mfa/disable)', () => {
    it('should accept otp_code field', async () => {
      mockService.disable.mockResolvedValue({ mfa_enabled: false });
      await controller.disableDelete(req, { otp_code: '123456' });
      expect(mockService.disable).toHaveBeenCalledWith(1, '123456');
    });
    it('should accept code field', async () => {
      mockService.disable.mockResolvedValue({ mfa_enabled: false });
      await controller.disableDelete(req, { code: '654321' });
      expect(mockService.disable).toHaveBeenCalledWith(1, '654321');
    });
    it('should fallback to empty string', async () => {
      mockService.disable.mockResolvedValue({ mfa_enabled: false });
      await controller.disableDelete(req, {});
      expect(mockService.disable).toHaveBeenCalledWith(1, '');
    });
  });

  describe('disablePost (POST /auth/mfa/disable)', () => {
    it('should accept otp_code field', async () => {
      mockService.disable.mockResolvedValue({ mfa_enabled: false });
      await controller.disablePost(req, { otp_code: '123456' });
      expect(mockService.disable).toHaveBeenCalledWith(1, '123456');
    });
    it('should accept code field', async () => {
      mockService.disable.mockResolvedValue({ mfa_enabled: false });
      await controller.disablePost(req, { code: '654321' });
      expect(mockService.disable).toHaveBeenCalledWith(1, '654321');
    });
    it('should fallback to empty string', async () => {
      mockService.disable.mockResolvedValue({ mfa_enabled: false });
      await controller.disablePost(req, {});
      expect(mockService.disable).toHaveBeenCalledWith(1, '');
    });
  });

  describe('verify', () => {
    it('should accept otp_code field', async () => {
      mockService.verify.mockResolvedValue({ valid: true });
      await controller.verify(req, { otp_code: '123456' });
      expect(mockService.verify).toHaveBeenCalledWith(1, '123456');
    });
    it('should accept code field', async () => {
      mockService.verify.mockResolvedValue({ valid: true });
      await controller.verify(req, { code: '654321' });
      expect(mockService.verify).toHaveBeenCalledWith(1, '654321');
    });
    it('should fallback to empty string', async () => {
      mockService.verify.mockResolvedValue({ valid: true });
      await controller.verify(req, {});
      expect(mockService.verify).toHaveBeenCalledWith(1, '');
    });
  });
});
