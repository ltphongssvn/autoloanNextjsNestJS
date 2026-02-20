// apps/backend/src/applications/applications.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from '@prisma/client';
import { StatusHistoryService } from './status-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreateApplicationDto } from './create-application.dto';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly statusHistoryService: StatusHistoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new loan application' })
  @ApiResponse({ status: 201, description: 'Application created' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List applications (own for customers, all for staff)' })
  findAll(@Req() req: AuthenticatedRequest) {
    const { sub, role } = req.user;
    if (role === 'loan_officer' || role === 'underwriter') {
      return this.applicationsService.findAll();
    }
    return this.applicationsService.findAllForUser(sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application detail with relations' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.applicationsService.findOne(id, req.user.sub, req.user.role);
  }

  @Get(':id/history')
  @Roles('loan_officer', 'underwriter')
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
