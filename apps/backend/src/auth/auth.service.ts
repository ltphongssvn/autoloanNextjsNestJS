// apps/backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const MAX_FAILED_ATTEMPTS = 5;

export const ROLE_SCOPES: Record<string, string[]> = {
  customer: ['applications:read', 'applications:write', 'documents:read', 'documents:write', 'profile:read', 'profile:write'],
  loan_officer: ['applications:read', 'applications:write', 'applications:review', 'documents:read', 'documents:write',
    'documents:verify', 'profile:read', 'users:read'],
  underwriter: ['applications:read', 'applications:write', 'applications:approve', 'applications:reject',
    'documents:read', 'documents:verify', 'profile:read', 'users:read'],
};

interface LoginDto {
  email: string;
  password: string;
}

interface SignupDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      created_at: user.createdAt.toISOString(),
    };
  }

  private generateToken(user: any) {
    const jti = uuidv4();
    const scopes = ROLE_SCOPES[user.role] || [];
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, scopes, jti });
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.lockedAt) {
      throw new ForbiddenException('Account is locked. Please check your email for unlock instructions.');
    }
    const valid = await bcrypt.compare(dto.password, user.encryptedPassword);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const lockData: any = { failedAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        lockData.lockedAt = new Date();
        lockData.unlockToken = uuidv4();
      }
      await this.prisma.user.update({ where: { id: user.id }, data: lockData });
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        throw new ForbiddenException('Account is locked. Please check your email for unlock instructions.');
      }
      throw new UnauthorizedException('Invalid credentials');
    }
    // Devise :trackable — update sign-in stats
    const trackData: any = {
      signInCount: user.signInCount + 1,
      lastSignInAt: user.currentSignInAt,
      lastSignInIp: user.currentSignInIp,
      currentSignInAt: new Date(),
      currentSignInIp: ip || null,
      failedAttempts: 0,
    };
    await this.prisma.user.update({ where: { id: user.id }, data: trackData });
    return { token: this.generateToken(user), user: this.formatUser(user) };
  }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(dto.password, 12);
    const confirmationToken = uuidv4();
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        encryptedPassword: hashed,
        firstName: dto.first_name,
        lastName: dto.last_name,
        phone: dto.phone || '',
        confirmationToken,
        confirmationSentAt: new Date(),
      },
    });
    return { token: this.generateToken(user), user: this.formatUser(user), confirmation_token: confirmationToken };
  }

  async confirmEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { confirmationToken: token } });
    if (!user) {
      throw new NotFoundException('Invalid confirmation token');
    }
    if (user.confirmedAt) {
      return { message: 'Email already confirmed' };
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { confirmedAt: new Date(), confirmationToken: null },
    });
    return { message: 'Email confirmed successfully' };
  }

  async resendConfirmation(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a confirmation link has been sent' };
    }
    if (user.confirmedAt) {
      return { message: 'Email already confirmed' };
    }
    const confirmationToken = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { confirmationToken, confirmationSentAt: new Date() },
    });
    return { message: 'If the email exists, a confirmation link has been sent', confirmation_token: confirmationToken };
  }

  async unlockAccount(token: string) {
    const user = await this.prisma.user.findFirst({ where: { unlockToken: token } });
    if (!user) {
      throw new NotFoundException('Invalid unlock token');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lockedAt: null, unlockToken: null, failedAttempts: 0 },
    });
    return { message: 'Account unlocked successfully' };
  }

  async resendUnlock(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the account exists and is locked, unlock instructions have been sent' };
    }
    if (!user.lockedAt) {
      return { message: 'Account is not locked' };
    }
    const unlockToken = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { unlockToken },
    });
    return { message: 'If the account exists and is locked, unlock instructions have been sent', unlock_token: unlockToken };
  }

  async logout(jti: string) {
    await this.prisma.jwtDenylist.create({ data: { jti } });
  }

  async refresh(userId: number, oldJti: string) {
    await this.prisma.jwtDenylist.create({ data: { jti: oldJti } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { token: this.generateToken(user), user: this.formatUser(user) };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }
    const token = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordSentAt: new Date() },
    });
    return { message: 'If the email exists, a reset link has been sent', reset_token: token };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { resetPasswordToken: token } });
    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }
    if (user.resetPasswordSentAt) {
      const hoursSince = (Date.now() - user.resetPasswordSentAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        throw new UnauthorizedException('Reset token has expired');
      }
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        encryptedPassword: hashed,
        resetPasswordToken: null,
        resetPasswordSentAt: null,
      },
    });
    return { message: 'Password reset successfully' };
  }
}
