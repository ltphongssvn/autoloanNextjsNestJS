// apps/backend/src/auth/auth.controller.ts
import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './jwt.strategy';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(200)
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('signup')
  signup(@Body() body: { email: string; password: string; first_name: string; last_name: string; phone?: string }) {
    return this.authService.signup(body);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.jti);
  }
}
