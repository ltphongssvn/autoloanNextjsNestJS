// apps/backend/src/auth/roles.decorator.spec.ts
import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should set metadata with ROLES_KEY', () => {
    const decorator = Roles('customer', 'loan_officer');
    const target = class TestClass {};
    decorator(target);
    const roles = Reflect.getMetadata(ROLES_KEY, target);
    expect(roles).toEqual(['customer', 'loan_officer']);
  });

  it('should handle single role', () => {
    const decorator = Roles('underwriter');
    const target = class TestClass {};
    decorator(target);
    const roles = Reflect.getMetadata(ROLES_KEY, target);
    expect(roles).toEqual(['underwriter']);
  });

  it('should handle empty roles', () => {
    const decorator = Roles();
    const target = class TestClass {};
    decorator(target);
    const roles = Reflect.getMetadata(ROLES_KEY, target);
    expect(roles).toEqual([]);
  });

  it('should export ROLES_KEY as "roles"', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
