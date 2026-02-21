// apps/backend/src/auth/auth.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule, getJwtSecret, getJwtExpiration } from './auth.module';
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
describe('getJwtSecret', () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => { process.env.JWT_SECRET = original; });
  it('returns env value when set', () => {
    process.env.JWT_SECRET = 'my-secret'; // pragma: allowlist secret
    expect(getJwtSecret()).toBe('my-secret');
  });
  it('returns default when not set', () => {
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).toBe('default-secret-change-me');
  });
});
describe('getJwtExpiration', () => {
  const original = process.env.JWT_EXPIRATION;
  afterEach(() => { process.env.JWT_EXPIRATION = original; });
  it('returns numeric value when set', () => {
    process.env.JWT_EXPIRATION = '7200';
    expect(getJwtExpiration()).toBe(7200);
  });
  it('returns default when not set', () => {
    delete process.env.JWT_EXPIRATION;
    expect(getJwtExpiration()).toBe(3600);
  });
  it('returns default for non-numeric value', () => {
    process.env.JWT_EXPIRATION = '7d';
    expect(getJwtExpiration()).toBe(3600);
  });
});
