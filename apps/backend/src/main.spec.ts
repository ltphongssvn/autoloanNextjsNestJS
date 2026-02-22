// apps/backend/src/main.spec.ts
const mockApp = {
  setGlobalPrefix: jest.fn(),
  enableCors: jest.fn(),
  useGlobalFilters: jest.fn(),
  useGlobalPipes: jest.fn(),
  useGlobalInterceptors: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@nestjs/core', () => ({
  NestFactory: { create: jest.fn().mockResolvedValue(mockApp) },
  ValidationPipe: jest.fn(),
}));
jest.mock('@nestjs/swagger', () => {
  const passthrough = () => () => {};
  return {
    DocumentBuilder: jest.fn().mockReturnValue({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    }),
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    },
    ApiTags: passthrough,
    ApiOperation: passthrough,
    ApiResponse: passthrough,
    ApiBearerAuth: passthrough,
    ApiConsumes: passthrough,
  };
});
jest.mock('./http-exception.filter', () => ({
  GlobalExceptionFilter: jest.fn(),
}));
jest.mock('./response-envelope.interceptor', () => ({
  ResponseEnvelopeInterceptor: jest.fn(),
}));
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { bootstrap } from './main';
describe('Bootstrap', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });
  afterAll(async () => {
    process.env = originalEnv;
    await mockApp.close();
    jest.restoreAllMocks();
  });
  it('should create app and configure with Swagger', async () => {
    process.env.PORT = '4000';
    await bootstrap();
    expect(NestFactory.create).toHaveBeenCalledTimes(1);
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useGlobalFilters).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.useGlobalInterceptors).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith('4000');
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api/docs', mockApp, expect.any(Object));
  });
  it('should use default port when PORT not set', async () => {
    delete process.env.PORT;
    await bootstrap();
    expect(mockApp.listen).toHaveBeenCalledWith(3001);
  });
});
