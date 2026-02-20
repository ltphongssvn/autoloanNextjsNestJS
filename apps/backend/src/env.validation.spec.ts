// apps/backend/src/env.validation.spec.ts
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, DATABASE_URL: 'postgres://localhost/test', JWT_SECRET: 'secret' }; // pragma: allowlist secret
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return config with valid env', () => {
    const config = validateEnv();
    expect(config.DATABASE_URL).toBe('postgres://localhost/test');
    expect(config.JWT_SECRET).toBe('secret'); // pragma: allowlist secret
    expect(config.JWT_EXPIRATION).toBe('24h');
    expect(config.PORT).toBe('3001');
    expect(config.FRONTEND_URL).toBe('http://localhost:3000');
  });

  it('should use custom values when provided', () => {
    process.env.JWT_EXPIRATION = '1h';
    process.env.PORT = '4000';
    process.env.FRONTEND_URL = 'https://app.example.com';
    const config = validateEnv();
    expect(config.JWT_EXPIRATION).toBe('1h');
    expect(config.PORT).toBe('4000');
    expect(config.FRONTEND_URL).toBe('https://app.example.com');
  });

  it('should throw if DATABASE_URL missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow('Missing required environment variables: DATABASE_URL');
  });

  it('should throw if JWT_SECRET missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => validateEnv()).toThrow('Missing required environment variables: JWT_SECRET');
  });

  it('should throw listing all missing vars', () => {
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    expect(() => validateEnv()).toThrow('Missing required environment variables: DATABASE_URL, JWT_SECRET');
  });
});
