// apps/backend/src/auth/auth.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './jwt.strategy';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.sub);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'JWT token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'User created and JWT returned' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  signup(@Body() body: { email: string; password: string; first_name: string; last_name: string }) {
    return this.authService.signup(body);
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate token' })
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.jti);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'New JWT token returned' })
  refresh(@Req() req: AuthenticatedRequest) {
    return this.authService.refresh(req.user.sub, req.user.jti);
  }

  @Get('confirmation')
  @ApiOperation({ summary: 'Confirm email with token (Devise-compatible)' })
  @ApiResponse({ status: 200, description: 'Email confirmed' })
  confirmEmail(@Query('confirmation_token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @Post('confirmation')
  @ApiOperation({ summary: 'Resend confirmation email (Devise-compatible)' })
  @ApiResponse({ status: 200, description: 'Confirmation email sent' })
  resendConfirmation(@Body() body: { email?: string; user?: { email: string } }) {
    const email = body.email || body.user?.email || '';
    return this.authService.resendConfirmation(email);
  }

  @Post('password')
  @ApiOperation({ summary: 'Request password reset email (Devise-compatible)' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  requestPasswordReset(@Body() body: { email?: string; user?: { email: string } }) {
    const email = body.email || body.user?.email || '';
    return this.authService.requestPasswordReset(email);
  }

  @Put('password')
  @ApiOperation({ summary: 'Reset password with token (Devise-compatible)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  resetPassword(@Body() body: {
    token?: string;
    password?: string;
    user?: { reset_password_token: string; password: string; password_confirmation: string };
  }) {
    const token = body.token || body.user?.reset_password_token || '';
    const password = body.password || body.user?.password || '';
    return this.authService.resetPassword(token, password);
  }
}
