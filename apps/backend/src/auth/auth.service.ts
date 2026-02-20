// apps/backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.encryptedPassword);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const jti = uuidv4();
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, jti });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.firstName,
        last_name: user.lastName,
        full_name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        created_at: user.createdAt.toISOString(),
      },
    };
  }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        encryptedPassword: hashed,
        firstName: dto.first_name,
        lastName: dto.last_name,
        phone: dto.phone || "",
      },
    });

    const jti = uuidv4();
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, jti });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.firstName,
        last_name: user.lastName,
        full_name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        created_at: user.createdAt.toISOString(),
      },
    };
  }

  async logout(jti: string) {
    await this.prisma.jwtDenylist.create({ data: { jti } });
  }
}
