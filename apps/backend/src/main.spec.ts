// apps/backend/src/main.spec.ts
import { NestFactory } from '@nestjs/core';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      useGlobalFilters: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('./http-exception.filter', () => ({
  GlobalExceptionFilter: jest.fn(),
}));

describe('Bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create app and configure', async () => {
    jest.isolateModules(() => require('./main'));
    await new Promise((r) => setTimeout(r, 100));
    const app = await (NestFactory.create as jest.Mock).mock.results[0].value;
    expect(NestFactory.create).toHaveBeenCalledTimes(1);
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(app.enableCors).toHaveBeenCalled();
    expect(app.useGlobalFilters).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(3001);
  });

  it('should use PORT from environment when set', async () => {
    process.env.PORT = '4000';
    jest.isolateModules(() => require('./main'));
    await new Promise((r) => setTimeout(r, 100));
    const app = await (NestFactory.create as jest.Mock).mock.results[0].value;
    expect(app.listen).toHaveBeenCalledWith('4000');
    delete process.env.PORT;
  });
});
