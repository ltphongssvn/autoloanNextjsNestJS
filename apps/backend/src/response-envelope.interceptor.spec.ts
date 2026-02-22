// apps/backend/src/response-envelope.interceptor.spec.ts
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';

describe('ResponseEnvelopeInterceptor', () => {
  let interceptor: ResponseEnvelopeInterceptor;

  const mockContext = (statusCode = 200) => ({
    switchToHttp: () => ({
      getResponse: () => ({ statusCode }),
    }),
  });

  const mockHandler = (data: any) => ({
    handle: () => of(data),
  });

  beforeEach(() => {
    interceptor = new ResponseEnvelopeInterceptor();
  });

  it('should wrap response in envelope', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext() as any, mockHandler({ id: 1 }) as any),
    );
    expect(result).toEqual({
      status: { code: 200, message: 'Success' },
      data: { id: 1 },
    });
  });

  it('should use 201 message for created', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext(201) as any, mockHandler({ id: 1 }) as any),
    );
    expect(result.status).toEqual({ code: 201, message: 'Created successfully' });
  });

  it('should use data.message if present', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext() as any, mockHandler({ message: 'Application deleted' }) as any),
    );
    expect(result.status.message).toBe('Application deleted');
  });

  it('should skip already-enveloped responses', async () => {
    const enveloped = { status: { code: 200, message: 'OK' }, data: { id: 1 } };
    const result = await lastValueFrom(
      interceptor.intercept(mockContext() as any, mockHandler(enveloped) as any),
    );
    expect(result).toEqual(enveloped);
  });

  it('should skip Buffer responses', async () => {
    const buf = Buffer.from('pdf-content');
    const result = await lastValueFrom(
      interceptor.intercept(mockContext() as any, mockHandler(buf) as any),
    );
    expect(result).toEqual(buf);
  });

  it('should handle null data', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext() as any, mockHandler(null) as any),
    );
    expect(result).toEqual({ status: { code: 200, message: 'Success' }, data: null });
  });

  it('should handle undefined data', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext() as any, mockHandler(undefined) as any),
    );
    expect(result).toEqual({ status: { code: 200, message: 'Success' }, data: null });
  });

  it('should handle 204 status', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext(204) as any, mockHandler({}) as any),
    );
    expect(result.status).toEqual({ code: 204, message: 'Deleted successfully' });
  });

  it('should default message for unknown status codes', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext(202) as any, mockHandler({ id: 1 }) as any),
    );
    expect(result.status.message).toBe('Success');
  });
});
