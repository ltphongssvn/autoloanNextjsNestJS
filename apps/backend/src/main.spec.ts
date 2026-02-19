// apps/backend/src/main.spec.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

jest.mock('helmet', () => jest.fn(() => 'helmet-middleware'));

describe('Bootstrap', () => {
  const mockApp = {
    use: jest.fn(),
    enableCors: jest.fn(),
    setGlobalPrefix: jest.fn(),
    useGlobalPipes: jest.fn(),
    listen: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.resetModules();
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should create app, configure security, and listen on default port', async () => {
    delete process.env.PORT;

    // Re-import to trigger bootstrap
    jest.isolateModules(() => {
      require('./main');
    });

    // Allow async bootstrap to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(mockApp.use).toHaveBeenCalled();
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith(3001);
  });

  it('should use PORT from environment when set', async () => {
    process.env.PORT = '4000';

    jest.isolateModules(() => {
      require('./main');
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(mockApp.listen).toHaveBeenCalledWith('4000');

    delete process.env.PORT;
  });
});
