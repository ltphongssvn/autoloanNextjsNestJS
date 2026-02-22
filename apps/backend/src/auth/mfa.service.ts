// apps/backend/src/auth/mfa.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { mfa_enabled: !!user?.otpRequiredForLogin };
  }

  async setup(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.otpRequiredForLogin) {
      throw new BadRequestException('MFA is already enabled');
    }
    const secret = crypto.randomBytes(20).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { otpSecret: secret },
    });
    const otpAuthUrl = `otpauth://totp/AutoLoan:${user?.email}?secret=${secret}&issuer=AutoLoan`;
    const qrCodeSvg = await QRCode.toString(otpAuthUrl, { type: 'svg' });
    return { secret, otp_auth_url: otpAuthUrl, qr_code_svg: qrCodeSvg };
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
    const step = 30;
    const now = Math.floor(Date.now() / 1000);
    for (let i = -1; i <= 1; i++) {
      const counter = Math.floor((now + i * step) / step);
      const expected = this.generateTotp(secret, counter);
      if (expected === code) return true;
    }
    return false;
  }

  private generateTotp(secret: string, counter: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(buffer);
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    return (binary % 1000000).toString().padStart(6, '0');
  }

  private verifyBackupCode(user: { otpBackupCodes: string | null }, code: string): boolean {
    if (!user.otpBackupCodes) return false;
    const codes: string[] = JSON.parse(user.otpBackupCodes);
    return codes.includes(code);
  }
}
