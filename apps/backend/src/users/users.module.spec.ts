// apps/backend/src/users/users.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  let module: TestingModule;
  beforeEach(async () => { module = await Test.createTestingModule({ imports: [UsersModule] }).compile(); });
  it('should compile', () => expect(module).toBeDefined());
  it('should provide UsersController', () => expect(module.get<UsersController>(UsersController)).toBeDefined());
  it('should provide UsersService', () => expect(module.get<UsersService>(UsersService)).toBeDefined());
});
