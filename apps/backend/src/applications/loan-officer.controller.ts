// apps/backend/src/applications/loan-officer.controller.ts
import { Controller, Get, Post, Param, Body, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma.service';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@ApiTags('Loan Officer')
@ApiBearerAuth()
@Controller('loan-officer/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('loan_officer')
export class LoanOfficerController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly workflowService: ApplicationWorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List applications for loan officer review' })
  findAll() {
    return this.prisma.application.findMany({
      where: { status: { in: ['submitted', 'under_review', 'pending_documents'] } },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application detail for review' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.applicationsService.findOne(id, req.user.sub, req.user.role);
  }

  @Post(':id/start-verification')
  @ApiOperation({ summary: 'Start verification process' })
  @ApiResponse({ status: 200, description: 'Verification started' })
  startVerification(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.startVerification(id, req.user.sub);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Move application to review' })
  @ApiResponse({ status: 200, description: 'Application moved to review' })
  review(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.moveToReview(id, req.user.sub);
  }

  @Post(':id/request-documents')
  @ApiOperation({ summary: 'Request documents from applicant' })
  @ApiResponse({ status: 200, description: 'Documents requested' })
  async requestDocuments(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { documents?: string[]; document_requests?: { doc_type: string; note?: string }[]; notes?: string },
  ) {
    const updated = await this.workflowService.requestDocuments(id, req.user.sub);
    const docRequests = body.document_requests || [];
    const docTypes = body.documents || [];
    for (const dr of docRequests) {
      await this.prisma.document.create({
        data: {
          applicationId: id,
          docType: dr.doc_type as any,
          fileName: `requested_${dr.doc_type}`,
          status: 'requested',
          requestNote: dr.note,
        },
      });
    }
    for (const dt of docTypes) {
      await this.prisma.document.create({
        data: {
          applicationId: id,
          docType: dt as any,
          fileName: `requested_${dt}`,
          status: 'requested',
          requestNote: body.notes,
        },
      });
    }
    if (docRequests.length > 0 || docTypes.length > 0 || body.notes) {
      const docList = docRequests.map(d => d.doc_type).join(', ') || docTypes.join(', ');
      await this.prisma.applicationNote.create({
        data: {
          applicationId: id,
          userId: req.user.sub,
          note: `Documents requested: ${docList}. Notes: ${body.notes || ''}`,
          internal: true,
        },
      });
    }
    return updated;
  }

  @Post(':id/add-note')
  @ApiOperation({ summary: 'Add a note to application' })
  @ApiResponse({ status: 201, description: 'Note added' })
  addNote(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { note: string; internal?: boolean },
  ) {
    return this.prisma.applicationNote.create({
      data: {
        applicationId: id,
        userId: req.user.sub,
        note: body.note,
        internal: body.internal ?? true,
      },
    });
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'List notes for application' })
  getNotes(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.applicationNote.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
