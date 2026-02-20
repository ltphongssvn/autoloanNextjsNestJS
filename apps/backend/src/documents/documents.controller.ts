// apps/backend/src/documents/documents.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@Controller('applications/:applicationId/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles('customer')
  upload(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { fileName: string; docType: string; fileUrl: string; fileSize?: number; contentType?: string },
  ) {
    return this.documentsService.upload(applicationId, req.user.sub, body.fileName, body.docType as any, body.fileUrl, body.fileSize, body.contentType);
  }

  @Get()
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.documentsService.findByApplication(applicationId);
  }

  @Patch(':id/status')
  @Roles('loan_officer', 'underwriter')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body('status') status: string,
  ) {
    return this.documentsService.updateStatus(id, status as any, req.user.sub);
  }
}
