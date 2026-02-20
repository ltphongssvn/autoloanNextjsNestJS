// apps/backend/src/main.spec.ts
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

const mockApp = {
  setGlobalPrefix: jest.fn(),
  enableCors: jest.fn(),
  useGlobalFilters: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue(mockApp),
  },
}));

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

describe('Bootstrap', () => {
  it('should create app and configure with Swagger', async () => {
    await import('./main');
    await new Promise((r) => setTimeout(r, 100));
    expect(NestFactory.create).toHaveBeenCalledTimes(1);
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useGlobalFilters).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalled();
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api/docs', mockApp, expect.any(Object));
  });
});
