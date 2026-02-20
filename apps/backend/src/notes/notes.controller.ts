// apps/backend/src/notes/notes.controller.ts
import { Controller, Get, Post, Param, Body, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@Controller('applications/:applicationId/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @Roles('loan_officer', 'underwriter')
  create(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { note: string; internal?: boolean },
  ) {
    return this.notesService.create(applicationId, req.user.sub, body.note, body.internal);
  }

  @Get()
  @Roles('loan_officer', 'underwriter')
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.notesService.findByApplication(applicationId);
  }
}
