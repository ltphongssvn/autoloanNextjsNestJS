import { Test } from '@nestjs/testing';
import { MfaService } from './mfa.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';

jest.mock('qrcode', () => ({
  toString: jest.fn().mockResolvedValue('<svg>mock-qr</svg>'),
}));

describe('MfaService', () => {
  let service: MfaService;
  const mockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MfaService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(MfaService);
    jest.clearAllMocks();
  });

  function generateValidCode(base32Secret: string): string {
    const totp = new OTPAuth.TOTP({
      issuer: 'AutoLoan',
      label: 'user',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(base32Secret),
    });
    return totp.generate();
  }

  function makeBase32Secret(): string {
    return new OTPAuth.Secret({ size: 20 }).base32;
  }

  describe('getStatus', () => {
    it('returns true when MFA enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ otpRequiredForLogin: true });
      expect(await service.getStatus(1)).toEqual({ mfa_enabled: true });
    });
    it('returns false when MFA disabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ otpRequiredForLogin: false });
      expect(await service.getStatus(1)).toEqual({ mfa_enabled: false });
    });
    it('returns false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await service.getStatus(1)).toEqual({ mfa_enabled: false });
    });
  });

  describe('setup', () => {
    it('generates base32 secret, otp_auth_url, and qr_code_svg', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.com', otpRequiredForLogin: false });
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.setup(1);
      expect(result.secret).toBeDefined(); // pragma: allowlist secret
      expect(result.secret).toMatch(/^[A-Z2-7]+=*$/); // base32 format // pragma: allowlist secret
      expect(result.otp_auth_url).toContain('otpauth://totp/');
      expect(result.qr_code_svg).toBe('<svg>mock-qr</svg>');
      expect(QRCode.toString).toHaveBeenCalledWith(expect.stringContaining('otpauth://'), { type: 'svg' });
    });
    it('throws if MFA already enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ otpRequiredForLogin: true });
      await expect(service.setup(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('enable', () => {
    it('enables MFA with valid code and returns 10 backup codes', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpSecret: secret }); // pragma: allowlist secret
      mockPrisma.user.update.mockResolvedValue({});
      const code = generateValidCode(secret);
      const result = await service.enable(1, code);
      expect(result.mfa_enabled).toBe(true);
      expect(result.backup_codes).toHaveLength(10);
    });
    it('throws if setup not initiated', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpSecret: null }); // pragma: allowlist secret
      await expect(service.enable(1, '123456')).rejects.toThrow(BadRequestException);
    });
    it('throws on invalid code', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpSecret: secret }); // pragma: allowlist secret
      await expect(service.enable(1, '000000')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('disable', () => {
    it('disables MFA with valid TOTP code', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpRequiredForLogin: true, otpSecret: secret, otpBackupCodes: '[]' }); // pragma: allowlist secret
      mockPrisma.user.update.mockResolvedValue({});
      const code = generateValidCode(secret);
      const result = await service.disable(1, code);
      expect(result.mfa_enabled).toBe(false);
    });
    it('disables MFA with valid backup code', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpRequiredForLogin: true, otpSecret: secret, otpBackupCodes: '["abc123"]' }); // pragma: allowlist secret
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.disable(1, 'abc123');
      expect(result.mfa_enabled).toBe(false);
    });
    it('throws if MFA not enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ otpRequiredForLogin: false });
      await expect(service.disable(1, '123456')).rejects.toThrow(BadRequestException);
    });
    it('throws on invalid code', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpRequiredForLogin: true, otpSecret: secret, otpBackupCodes: '[]' }); // pragma: allowlist secret
      await expect(service.disable(1, '000000')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verify', () => {
    it('verifies valid TOTP code', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpRequiredForLogin: true, otpSecret: secret, otpBackupCodes: '[]' }); // pragma: allowlist secret
      const code = generateValidCode(secret);
      const result = await service.verify(1, code);
      expect(result.valid).toBe(true);
    });
    it('verifies valid backup code and consumes it', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpRequiredForLogin: true, otpSecret: secret, otpBackupCodes: '["code1","code2"]' }); // pragma: allowlist secret
      mockPrisma.user.update.mockResolvedValue({});
      const result = await service.verify(1, 'code1');
      expect(result.valid).toBe(true);
      expect(result.backup_code_used).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { otpBackupCodes: JSON.stringify(['code2']) },
      });
    });
    it('throws if MFA not enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ otpRequiredForLogin: false, otpSecret: null }); // pragma: allowlist secret
      await expect(service.verify(1, '123456')).rejects.toThrow(BadRequestException);
    });
    it('throws on invalid code', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpRequiredForLogin: true, otpSecret: secret, otpBackupCodes: '[]' }); // pragma: allowlist secret
      await expect(service.verify(1, '000000')).rejects.toThrow(UnauthorizedException);
    });
    it('handles null backup codes', async () => {
      const secret = makeBase32Secret(); // pragma: allowlist secret
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, otpRequiredForLogin: true, otpSecret: secret, otpBackupCodes: null }); // pragma: allowlist secret
      await expect(service.verify(1, '000000')).rejects.toThrow(UnauthorizedException);
    });
  });
});
