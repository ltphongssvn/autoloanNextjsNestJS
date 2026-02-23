// apps/backend/src/auth/scopes.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'required_scopes';
export const RequireScope = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);
