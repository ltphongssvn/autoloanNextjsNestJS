// apps/backend/src/auth/scopes.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from './scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.scopes) {
      throw new ForbiddenException({
        error: {
          code: 'Forbidden',
          message: 'Insufficient scope for this action.',
          innererror: {
            code: 'InsufficientScope',
            details: [{ required: requiredScopes, available: [] }],
          },
        },
      });
    }
    const hasScope = requiredScopes.every((scope) => user.scopes.includes(scope));
    if (!hasScope) {
      throw new ForbiddenException({
        error: {
          code: 'Forbidden',
          message: 'Insufficient scope for this action.',
          innererror: {
            code: 'InsufficientScope',
            details: [{ required: requiredScopes, available: user.scopes }],
          },
        },
      });
    }
    return true;
  }
}
