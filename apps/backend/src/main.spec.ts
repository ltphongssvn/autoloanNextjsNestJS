// apps/backend/src/main.spec.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Bootstrap', () => {
  let mockApp: {
    use: jest.Mock;
    enableCors: jest.Mock;
    setGlobalPrefix: jest.Mock;
    useGlobalPipes: jest.Mock;
    listen: jest.Mock;
  };

  beforeEach(() => {
    mockApp = {
      use: jest.fn(),
      enableCors: jest.fn(),
      setGlobalPrefix: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create the app with AppModule', async () => {
    await import('./main');
    // Allow async bootstrap to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
  });

  it('should configure helmet, CORS, prefix, and validation', async () => {
    jest.resetModules();
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    jest.spyOn(console, 'log').mockImplementation();

    await import('./main');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockApp.use).toHaveBeenCalled();
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
  });

  it('should listen on port 3001 by default', async () => {
    jest.resetModules();
    delete process.env.PORT;
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    jest.spyOn(console, 'log').mockImplementation();

    await import('./main');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockApp.listen).toHaveBeenCalledWith(3001);
  });
});
