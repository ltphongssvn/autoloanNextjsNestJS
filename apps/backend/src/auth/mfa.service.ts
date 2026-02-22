// apps/backend/src/auth/mfa.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  private createTotp(secret: string, email?: string): OTPAuth.TOTP {
    return new OTPAuth.TOTP({
      issuer: 'AutoLoan',
      label: email || 'user',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
  }

  async getStatus(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { mfa_enabled: !!user?.otpRequiredForLogin };
  }

  async setup(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.otpRequiredForLogin) {
      throw new BadRequestException('MFA is already enabled');
    }
    const secret = new OTPAuth.Secret({ size: 20 });
    const base32Secret = secret.base32;
    await this.prisma.user.update({
      where: { id: userId },
      data: { otpSecret: base32Secret },
    });
    const totp = this.createTotp(base32Secret, user?.email);
    const otpAuthUrl = totp.toString();
    const qrCodeSvg = await QRCode.toString(otpAuthUrl, { type: 'svg' });
    return { secret: base32Secret, otp_auth_url: otpAuthUrl, qr_code_svg: qrCodeSvg };
  }

  async enable(userId: number, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.otpSecret) {
      throw new BadRequestException('MFA setup not initiated. Call setup first.');
    }
    if (!this.verifyTotp(user.otpSecret, code)) {
      throw new UnauthorizedException('Invalid verification code');
    }
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    await this.prisma.user.update({
      where: { id: userId },
      data: { otpRequiredForLogin: true, otpBackupCodes: JSON.stringify(backupCodes) },
    });
    return { mfa_enabled: true, backup_codes: backupCodes };
  }

  async disable(userId: number, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.otpRequiredForLogin) {
      throw new BadRequestException('MFA is not enabled');
    }
    if (!this.verifyTotp(user.otpSecret!, code) && !this.verifyBackupCode(user, code)) {
      throw new UnauthorizedException('Invalid verification code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { otpRequiredForLogin: false, otpSecret: null, otpBackupCodes: null },
    });
    return { mfa_enabled: false };
  }

  async verify(userId: number, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.otpRequiredForLogin || !user.otpSecret) {
      throw new BadRequestException('MFA is not enabled');
    }
    if (this.verifyTotp(user.otpSecret, code)) {
      return { valid: true };
    }
    if (this.verifyBackupCode(user, code)) {
      const codes: string[] = JSON.parse(user.otpBackupCodes || '[]');
      const remaining = codes.filter((c) => c !== code);
      await this.prisma.user.update({
        where: { id: userId },
        data: { otpBackupCodes: JSON.stringify(remaining) },
      });
      return { valid: true, backup_code_used: true };
    }
    throw new UnauthorizedException('Invalid verification code');
  }

  private verifyTotp(secret: string, code: string): boolean {
    const totp = this.createTotp(secret);
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  private verifyBackupCode(user: { otpBackupCodes: string | null }, code: string): boolean {
    if (!user.otpBackupCodes) return false;
    const codes: string[] = JSON.parse(user.otpBackupCodes);
    return codes.includes(code);
  }
}
