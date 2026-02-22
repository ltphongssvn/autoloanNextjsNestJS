import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './http-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => ({ status: mockStatus }),
      getRequest: () => ({ path: '/api/v1/test' }),
    }),
  } as any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.clearAllMocks();
  });

  it('should handle HttpException with Microsoft REST error format', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      error: expect.objectContaining({
        code: 'NotFound',
        message: 'Not Found',
        target: '/api/v1/test',
        innererror: expect.objectContaining({
          code: 'ResourceNotFound',
          timestamp: expect.any(String),
          request_id: expect.any(String),
        }),
      }),
    });
  });

  it('should handle unknown exception as 500', () => {
    filter.catch(new Error('unexpected'), mockHost);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: expect.objectContaining({
        code: 'InternalServerError',
        message: 'Internal server error',
        innererror: expect.objectContaining({ code: 'UnexpectedError' }),
      }),
    });
  });

  it('should include timestamp in innererror', () => {
    filter.catch(new Error('test'), mockHost);
    const call = mockJson.mock.calls[0][0];
    expect(call.error.innererror.timestamp).toEqual(expect.any(String));
  });

  it('should handle validation errors with details', () => {
    const exception = new HttpException({ message: ['field1 required', 'field2 invalid'], statusCode: 422 }, 422);
    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(422);
    const call = mockJson.mock.calls[0][0];
    expect(call.error.code).toBe('ValidationError');
    expect(call.error.message).toBe('field1 required. field2 invalid');
    expect(call.error.innererror.details).toEqual([
      { message: 'field1 required' },
      { message: 'field2 invalid' },
    ]);
  });

  it('should handle 401 Unauthorized', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(401);
    const call = mockJson.mock.calls[0][0];
    expect(call.error.code).toBe('Unauthorized');
    expect(call.error.innererror.code).toBe('AuthenticationRequired');
  });

  it('should handle 403 Forbidden', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);
    const call = mockJson.mock.calls[0][0];
    expect(call.error.code).toBe('Forbidden');
    expect(call.error.innererror.code).toBe('InsufficientPermissions');
  });
});
