// apps/backend/src/auth/mfa.controller.ts
import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MfaService } from './mfa.service';

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.mfaService.getStatus(req.user.sub);
  }

  @Post('setup')
  setup(@Request() req: any) {
    return this.mfaService.setup(req.user.sub);
  }

  @Post('enable')
  enable(@Request() req: any, @Body() body: { code?: string; otp_code?: string }) {
    const code = body.otp_code || body.code || '';
    return this.mfaService.enable(req.user.sub, code);
  }

  @Delete('disable')
  disableDelete(@Request() req: any, @Body() body: { code?: string; otp_code?: string }) {
    const code = body.otp_code || body.code || '';
    return this.mfaService.disable(req.user.sub, code);
  }

  @Post('disable')
  disablePost(@Request() req: any, @Body() body: { code?: string; otp_code?: string }) {
    const code = body.otp_code || body.code || '';
    return this.mfaService.disable(req.user.sub, code);
  }

  @Post('verify')
  verify(@Request() req: any, @Body() body: { code?: string; otp_code?: string }) {
    const code = body.otp_code || body.code || '';
    return this.mfaService.verify(req.user.sub, code);
  }
}
