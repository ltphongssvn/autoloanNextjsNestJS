// apps/backend/src/applications/applications.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, Res, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService, ApplicationQuery } from './applications.service';
import { ApplicationStatus } from './application-status.type';
import { StatusHistoryService } from './status-history.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { AgreementPdfService } from './agreement-pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreateApplicationDto } from './create-application.dto';
import { serializeApplication } from './application.serializer';
import { paginationMetadata } from './pagination.helper';
import { Response } from 'express';

interface AuthenticatedRequest {
  user: JwtPayload;
  path?: string;
}

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly statusHistoryService: StatusHistoryService,
    private readonly workflowService: ApplicationWorkflowService,
    private readonly agreementPdfService: AgreementPdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new loan application' })
  @ApiResponse({ status: 201, description: 'Application created' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List applications with OData filtering, sorting, and pagination' })
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
    const { sub, role } = req.user;
    const result = (role === 'loan_officer' || role === 'underwriter')
      ? await this.applicationsService.findAll(query)
      : await this.applicationsService.findAllForUser(sub, query);

    const basePath = req.path || '/api/v1/applications';
    return {
      data: result.data.map((app: any) => serializeApplication(app, { currentUserId: sub })),
      pagination: paginationMetadata(result.pagination.page, result.pagination.per_page, result.pagination.total, basePath),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application detail with relations' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const application = await this.applicationsService.findOne(id, req.user.sub, req.user.role);
    return serializeApplication(application, { currentUserId: req.user.sub });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update application (draft only)' })
  @ApiResponse({ status: 200, description: 'Application updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application (draft only)' })
  @ApiResponse({ status: 200, description: 'Application deleted' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.applicationsService.remove(id, req.user.sub);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft application' })
  @ApiResponse({ status: 200, description: 'Application submitted' })
  submit(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.workflowService.submit(id, req.user.sub);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Sign an approved application' })
  @ApiResponse({ status: 200, description: 'Agreement signed' })
  sign(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { signature_data: string },
  ) {
    return this.workflowService.sign(id, req.user.sub, body.signature_data);
  }

  @Get(':id/agreement_pdf')
  @ApiOperation({ summary: 'Download loan agreement PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  async agreementPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.agreementPdfService.generate(id, req.user.sub);
    res.set({ 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${filename}"` });
    res.send(buffer);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get status change history' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.statusHistoryService.findByApplication(id);
  }

  @Patch(':id/status')
  @Roles('loan_officer', 'underwriter')
  @ApiOperation({ summary: 'Update application status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { status: string },
  ) {
    return this.applicationsService.updateStatus(id, body.status as ApplicationStatus, req.user.sub);
  }
}
