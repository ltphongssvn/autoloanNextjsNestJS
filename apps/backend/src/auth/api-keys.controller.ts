// apps/backend/src/auth/api-keys.controller.ts
import { Controller, Get, Post, Delete, Patch, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeysService } from './api-keys.service';

@Controller(['auth/api-keys', 'auth/api_keys'])
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  list(@Request() req: any) {
    return this.apiKeysService.list(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.findOne(req.user.sub, id);
  }

  @Post()
  create(@Request() req: any, @Body() body: { name: string; expires_at?: string }) {
    const expiresAt = body.expires_at ? new Date(body.expires_at) : undefined;
    return this.apiKeysService.create(req.user.sub, body.name, expiresAt);
  }

  @Post(':id/revoke')
  revokePost(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.revoke(req.user.sub, id);
  }

  @Patch(':id/revoke')
  revokePatch(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.revoke(req.user.sub, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.remove(req.user.sub, id);
  }
}
