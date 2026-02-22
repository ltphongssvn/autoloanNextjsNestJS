// apps/backend/src/applications/loan-officer.controller.ts
import { Controller, Get, Patch, Post, Param, Body, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService, ApplicationQuery } from './applications.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { serializeApplication } from './application.serializer';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@ApiTags('Loan Officer')
@ApiBearerAuth()
@Controller(['loan-officer/applications', 'loan_officer/applications'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('loan_officer')
export class LoanOfficerController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly workflowService: ApplicationWorkflowService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all applications (loan officer)' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('$filter') $filter?: string,
    @Query('$orderby') $orderby?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    const query: ApplicationQuery = {
      $filter,
      $orderby,
      status,
      page: page ? parseInt(page, 10) : undefined,
      per_page: per_page ? parseInt(per_page, 10) : undefined,
    };
    const result = await this.applicationsService.findAll(query);
    return {
      data: result.data.map((app: any) => serializeApplication(app, { currentUserId: req.user.sub })),
      pagination: result.pagination,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application detail (loan officer)' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const app = await this.applicationsService.findOne(id);
    return serializeApplication(app, { currentUserId: req.user.sub });
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Start verification (PATCH)' })
  startVerification(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.startVerification(id, req.user.sub);
  }

  @Post(':id/start_verification')
  @ApiOperation({ summary: 'Start verification (POST, Rails-compatible)' })
  startVerificationPost(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.startVerification(id, req.user.sub);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Move to review (PATCH)' })
  moveToReview(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.moveToReview(id, req.user.sub);
  }

  @Patch(':id/request-documents')
  @ApiOperation({ summary: 'Request additional documents (PATCH)' })
  requestDocuments(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.requestDocuments(id, req.user.sub);
  }

  @Post(':id/request_documents')
  @ApiOperation({ summary: 'Request additional documents (POST, Rails-compatible)' })
  requestDocumentsPost(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.requestDocuments(id, req.user.sub);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve application (PATCH)' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { loan_term?: number; interest_rate?: number; monthly_payment?: number },
  ) {
    return this.workflowService.approve(id, req.user.sub, {
      loanTerm: body.loan_term,
      interestRate: body.interest_rate,
      monthlyPayment: body.monthly_payment,
    });
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve application (POST, Rails-compatible)' })
  approvePost(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { loan_term?: number; interest_rate?: number; monthly_payment?: number },
  ) {
    return this.workflowService.approve(id, req.user.sub, {
      loanTerm: body.loan_term,
      interestRate: body.interest_rate,
      monthlyPayment: body.monthly_payment,
    });
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject application (PATCH)' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { reason?: string },
  ) {
    return this.workflowService.reject(id, req.user.sub, body.reason);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject application (POST, Rails-compatible)' })
  rejectPost(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { reason?: string },
  ) {
    return this.workflowService.reject(id, req.user.sub, body.reason);
  }

  @Post(':id/add_note')
  @ApiOperation({ summary: 'Add note (POST, Rails-compatible)' })
  addNote(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { note: string; internal?: boolean },
  ) {
    // Placeholder - delegates to notes service when wired
    return { message: 'Note added', applicationId: id };
  }
}
