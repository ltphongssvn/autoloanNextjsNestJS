// apps/backend/src/main.spec.ts

const mockApp = {
  use: jest.fn().mockReturnThis(),
  enableCors: jest.fn().mockReturnThis(),
  setGlobalPrefix: jest.fn().mockReturnThis(),
  useGlobalPipes: jest.fn().mockReturnThis(),
  listen: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue(mockApp),
  },
  ValidationPipe: jest.fn(),
}));

jest.mock('helmet', () => jest.fn(() => 'helmet-middleware'));

jest.mock('./app.module', () => ({
  AppModule: jest.fn(),
}));

import { NestFactory } from '@nestjs/core';

describe('Bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create app, configure security, and listen on default port', async () => {
    delete process.env.PORT;

    jest.isolateModules(() => {
      require('./main');
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(NestFactory.create).toHaveBeenCalledTimes(1);
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

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(mockApp.listen).toHaveBeenCalledWith('4000');

    delete process.env.PORT;
  });

  it('should configure CORS with FRONTEND_URL when set', async () => {
    process.env.FRONTEND_URL = 'https://myapp.com';

    jest.isolateModules(() => {
      require('./main');
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(mockApp.enableCors).toHaveBeenCalledWith({
      origin: 'https://myapp.com',
      credentials: true,
    });

    delete process.env.FRONTEND_URL;
  });
});
