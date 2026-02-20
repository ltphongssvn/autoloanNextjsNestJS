// apps/backend/src/http-exception.filter.spec.ts
import { GlobalExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => ({ status: mockStatus }),
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.clearAllMocks();
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'Not Found',
    }));
  });

  it('should handle unknown exception as 500', () => {
    filter.catch(new Error('unexpected'), mockHost);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      message: 'Internal server error',
    }));
  });

  it('should include timestamp in response', () => {
    filter.catch(new Error('test'), mockHost);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      timestamp: expect.any(String),
    }));
  });
});
