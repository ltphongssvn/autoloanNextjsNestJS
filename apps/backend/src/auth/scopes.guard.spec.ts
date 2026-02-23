import { ScopesGuard } from './scopes.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('ScopesGuard', () => {
  let guard: ScopesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ScopesGuard(reflector);
  });

  function createContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('should allow when no scopes required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('should allow when empty scopes required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('should allow when user has required scope', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['applications:read']);
    const ctx = createContext({ scopes: ['applications:read', 'applications:write'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user has all required scopes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['applications:read', 'applications:write']);
    const ctx = createContext({ scopes: ['applications:read', 'applications:write', 'profile:read'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks scope', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['applications:approve']);
    const ctx = createContext({ scopes: ['applications:read'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no scopes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['applications:read']);
    const ctx = createContext({});
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['applications:read']);
    const ctx = createContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should include required and available scopes in error details', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['applications:approve']);
    const ctx = createContext({ scopes: ['applications:read'] });
    try {
      guard.canActivate(ctx);
    } catch (e: any) {
      const response = e.getResponse();
      expect(response.error.innererror.code).toBe('InsufficientScope');
      expect(response.error.innererror.details[0].required).toEqual(['applications:approve']);
      expect(response.error.innererror.details[0].available).toEqual(['applications:read']);
    }
  });

  it('should show empty available scopes when user has none', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['applications:read']);
    const ctx = createContext(null);
    try {
      guard.canActivate(ctx);
    } catch (e: any) {
      const response = e.getResponse();
      expect(response.error.innererror.details[0].available).toEqual([]);
    }
  });
});
