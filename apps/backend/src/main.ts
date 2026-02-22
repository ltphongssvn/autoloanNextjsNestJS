import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './http-exception.filter';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';
import { RateLimitHeadersInterceptor } from './rate-limit-headers.interceptor';
export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(), new RateLimitHeadersInterceptor());
  const config = new DocumentBuilder()
    .setTitle('AutoLoan API')
    .setDescription('Auto Loan Application API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
