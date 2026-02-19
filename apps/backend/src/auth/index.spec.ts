// apps/backend/src/auth/index.spec.ts
import {
  AuthModule,
  JwtAuthGuard,
  RolesGuard,
  Roles,
  ROLES_KEY,
  JwtStrategy,
} from './index';

describe('Auth barrel export', () => {
  it('should export AuthModule', () => {
    expect(AuthModule).toBeDefined();
  });

  it('should export JwtAuthGuard', () => {
    expect(JwtAuthGuard).toBeDefined();
  });

  it('should export RolesGuard', () => {
    expect(RolesGuard).toBeDefined();
  });

  it('should export Roles decorator', () => {
    expect(Roles).toBeDefined();
  });

  it('should export ROLES_KEY', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  it('should export JwtStrategy', () => {
    expect(JwtStrategy).toBeDefined();
  });
});
