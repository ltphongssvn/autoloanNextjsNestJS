// apps/backend/src/applications/underwriter.controller.ts
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

@ApiTags('Underwriter')
@ApiBearerAuth()
@Controller('underwriter/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('underwriter')
export class UnderwriterController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly workflowService: ApplicationWorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List applications for underwriter review' })
  findAll() {
    return this.prisma.application.findMany({
      where: { status: { in: ['under_review', 'pending_documents'] } },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application detail for underwriting' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.applicationsService.findOne(id, req.user.sub, req.user.role);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve application' })
  @ApiResponse({ status: 200, description: 'Application approved' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: {
      loan_term?: number;
      interest_rate?: number;
      monthly_payment?: number;
      decision_notes?: string;
      approval_conditions?: string;
    },
  ) {
    const updated = await this.workflowService.approve(id, req.user.sub, {
      loanTerm: body.loan_term,
      interestRate: body.interest_rate,
      monthlyPayment: body.monthly_payment,
    });
    if (body.decision_notes || body.approval_conditions) {
      const parts = ['Decision: Approved'];
      if (body.decision_notes) parts.push(`Notes: ${body.decision_notes}`);
      if (body.approval_conditions) parts.push(`Conditions: ${body.approval_conditions}`);
      await this.prisma.applicationNote.create({
        data: {
          applicationId: id,
          userId: req.user.sub,
          note: parts.join('\n'),
          internal: true,
        },
      });
    }
    return updated;
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject application' })
  @ApiResponse({ status: 200, description: 'Application rejected' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { rejection_reason?: string; decision_notes?: string },
  ) {
    const updated = await this.workflowService.reject(id, req.user.sub, body.rejection_reason);
    if (body.decision_notes) {
      await this.prisma.applicationNote.create({
        data: {
          applicationId: id,
          userId: req.user.sub,
          note: `Decision: Rejected\nNotes: ${body.decision_notes}`,
          internal: true,
        },
      });
    }
    return updated;
  }

  @Post(':id/request-documents')
  @ApiOperation({ summary: 'Request documents from applicant' })
  @ApiResponse({ status: 200, description: 'Documents requested' })
  async requestDocuments(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { documents?: string[]; notes?: string },
  ) {
    const updated = await this.workflowService.requestDocuments(id, req.user.sub);
    const docs = body.documents || [];
    if (docs.length > 0 || body.notes) {
      const docList = docs.join(', ');
      let noteText = `Documents requested: ${docList}`;
      if (body.notes) noteText += `. Notes: ${body.notes}`;
      await this.prisma.applicationNote.create({
        data: {
          applicationId: id,
          userId: req.user.sub,
          note: noteText,
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
      include: { user: true },
    });
  }
}
