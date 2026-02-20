// apps/backend/src/main.spec.ts
const mockApp = {
  setGlobalPrefix: jest.fn(),
  enableCors: jest.fn(),
  useGlobalFilters: jest.fn(),
  useGlobalPipes: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@nestjs/core', () => ({
  NestFactory: { create: jest.fn().mockResolvedValue(mockApp) },
  ValidationPipe: jest.fn(),
}));

jest.mock('@nestjs/swagger', () => ({
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
}));

jest.mock('./http-exception.filter', () => ({
  GlobalExceptionFilter: jest.fn(),
}));

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { bootstrap } from './main';

describe('Bootstrap', () => {
  beforeEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await mockApp.close();
    jest.restoreAllMocks();
  });

  it('should create app and configure with Swagger', async () => {
    await bootstrap();
    expect(NestFactory.create).toHaveBeenCalledTimes(1);
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useGlobalFilters).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith(3001);
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api/docs', mockApp, expect.any(Object));
  });
});
