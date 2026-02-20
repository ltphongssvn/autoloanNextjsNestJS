// apps/backend/src/applications/applications.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { StatusHistoryService } from './status-history.service';
import { CreateApplicationDto } from './create-application.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

interface AuthenticatedRequest {
  user: JwtPayload;
}

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly statusHistoryService: StatusHistoryService,
  ) {}

  @Post()
  @Roles('customer')
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    if (req.user.role === 'customer') {
      return this.applicationsService.findAllForUser(req.user.sub);
    }
    return this.applicationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.applicationsService.findOne(id, req.user.sub, req.user.role);
  }

  @Patch(':id/status')
  @Roles('loan_officer', 'underwriter')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: { status: string },
  ) {
    return this.applicationsService.updateStatus(id, body.status as any, req.user.sub);
  }

  @Get(':id/history')
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.statusHistoryService.findByApplication(id);
  }
}
