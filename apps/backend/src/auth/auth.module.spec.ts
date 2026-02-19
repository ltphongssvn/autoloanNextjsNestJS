// apps/backend/src/auth/auth.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { JwtStrategy } from './jwt.strategy';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret-for-unit-tests'; // pragma: allowlist secret
    module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide JwtStrategy', () => {
    expect(module.get<JwtStrategy>(JwtStrategy)).toBeDefined();
  });

  it('should provide JwtAuthGuard', () => {
    expect(module.get<JwtAuthGuard>(JwtAuthGuard)).toBeDefined();
  });

  it('should provide RolesGuard', () => {
    expect(module.get<RolesGuard>(RolesGuard)).toBeDefined();
  });
});
