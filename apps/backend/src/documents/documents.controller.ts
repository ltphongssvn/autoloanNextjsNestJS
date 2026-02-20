// apps/backend/src/documents/documents.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('applications/:applicationId/documents')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { doc_type: string },
  ) {
    return this.documentsService.upload(applicationId, req.user.sub, file, body.doc_type);
  }

  @Get('applications/:applicationId/documents')
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.documentsService.findByApplication(applicationId);
  }

  @Patch('documents/:id/status')
  @Roles('loan_officer', 'underwriter')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { status: string; rejection_note?: string },
  ) {
    return this.documentsService.updateStatus(id, body.status, req.user.sub, body.rejection_note);
  }
}
