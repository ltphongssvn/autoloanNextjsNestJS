// apps/backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { MfaController } from './mfa.controller';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { MfaService } from './mfa.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma.service';

export const getJwtSecret = () => process.env.JWT_SECRET || 'default-secret-change-me';
export const getJwtExpiration = () => Number(process.env.JWT_EXPIRATION) || 3600;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiration() },
    }),
  ],
  controllers: [AuthController, MfaController, ApiKeysController],
  providers: [AuthService, MfaService, ApiKeysService, JwtStrategy, JwtAuthGuard, RolesGuard, PrismaService],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
