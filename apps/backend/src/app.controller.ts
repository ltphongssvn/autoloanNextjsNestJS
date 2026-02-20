// apps/backend/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health')
  @SkipThrottle()
  health() {
    return { ...this.appService.getHealth(), uptime: process.uptime() };
  }
}
