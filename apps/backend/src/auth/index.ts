// apps/backend/src/auth/index.ts
export { AuthModule } from './auth.module';
export { JwtAuthGuard } from './jwt-auth.guard';
export { RolesGuard } from './roles.guard';
export { Roles, ROLES_KEY } from './roles.decorator';
export { JwtStrategy, JwtPayload } from './jwt.strategy';
