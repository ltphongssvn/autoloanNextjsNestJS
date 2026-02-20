// apps/backend/src/documents/documents.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@ApiTags('Documents')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('applications/:applicationId/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document for an application' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  upload(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { doc_type: string },
  ) {
    return this.documentsService.upload(applicationId, req.user.sub, file, body.doc_type);
  }

  @Get('applications/:applicationId/documents')
  @ApiOperation({ summary: 'List documents for an application' })
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.documentsService.findByApplication(applicationId);
  }

  @Patch('documents/:id/status')
  @Roles('loan_officer', 'underwriter')
  @ApiOperation({ summary: 'Verify or reject a document' })
  @ApiResponse({ status: 200, description: 'Document status updated' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { status: string; rejection_note?: string },
  ) {
    return this.documentsService.updateStatus(id, body.status, req.user.sub, body.rejection_note);
  }
}
