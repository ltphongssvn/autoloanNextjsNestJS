// apps/backend/src/users/index.spec.ts
import { UsersModule, UsersService, UsersController } from './index';

describe('Users barrel export', () => {
  it('should export UsersModule', () => expect(UsersModule).toBeDefined());
  it('should export UsersService', () => expect(UsersService).toBeDefined());
  it('should export UsersController', () => expect(UsersController).toBeDefined());
});
