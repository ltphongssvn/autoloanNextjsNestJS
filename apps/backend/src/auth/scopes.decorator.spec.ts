import { RequireScope, SCOPES_KEY } from './scopes.decorator';
import 'reflect-metadata';

describe('RequireScope decorator', () => {
  it('should set metadata with single scope', () => {
    class TestClass {
      @RequireScope('applications:read')
      handler() {}
    }
    const metadata = Reflect.getMetadata(SCOPES_KEY, TestClass.prototype.handler);
    expect(metadata).toEqual(['applications:read']);
  });

  it('should set metadata with multiple scopes', () => {
    class TestClass {
      @RequireScope('applications:read', 'applications:write')
      handler() {}
    }
    const metadata = Reflect.getMetadata(SCOPES_KEY, TestClass.prototype.handler);
    expect(metadata).toEqual(['applications:read', 'applications:write']);
  });
});
