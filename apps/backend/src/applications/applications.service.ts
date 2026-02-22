// apps/backend/src/applications/applications.service.ts
import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateApplicationDto } from './create-application.dto';
import { ApplicationStatus } from '@prisma/client';
import { NotificationsService } from '../notifications';

export interface ApplicationQuery {
  $filter?: string;
  $orderby?: string;
  $select?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

const ALLOWED_FILTER_FIELDS = ['status', 'current_step', 'loan_term', 'interest_rate', 'created_at', 'updated_at', 'submitted_at'];
const ALLOWED_ORDER_FIELDS = ['status', 'current_step', 'created_at', 'updated_at', 'submitted_at', 'loan_amount'];

const FIELD_MAP: Record<string, string> = {
  status: 'status',
  current_step: 'currentStep',
  loan_term: 'loanTerm',
  interest_rate: 'interestRate',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  submitted_at: 'submittedAt',
  loan_amount: 'loanAmount',
};

const LIST_INCLUDES = {
  user: true,
  addresses: true,
  vehicles: true,
  financialInfos: true,
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private parseOdataFilter(filterStr: string): Record<string, any> {
    const where: Record<string, any> = {};
    const parts = filterStr.split(/\s+and\s+/i);

    for (const part of parts) {
      const trimmed = part.trim();

      const containsMatch = trimmed.match(/^contains\s*\(\s*(\w+)\s*,\s*'([^']*)'\s*\)$/i);
      if (containsMatch) {
        const [, field, value] = containsMatch;
        if (!ALLOWED_FILTER_FIELDS.includes(field)) continue;
        const prismaField = FIELD_MAP[field] || field;
        where[prismaField] = { contains: value, mode: 'insensitive' };
        continue;
      }

      const opMatch = trimmed.match(/^(\w+)\s+(eq|ne|gt|ge|lt|le)\s+(.+)$/i);
      if (opMatch) {
        const [, field, op, rawValue] = opMatch;
        if (!ALLOWED_FILTER_FIELDS.includes(field)) continue;
        const prismaField = FIELD_MAP[field] || field;
        const value = this.parseFilterValue(rawValue.trim());

        switch (op.toLowerCase()) {
          case 'eq': where[prismaField] = value; break;
          case 'ne': where[prismaField] = { not: value }; break;
          case 'gt': where[prismaField] = { gt: value }; break;
          case 'ge': where[prismaField] = { gte: value }; break;
          case 'lt': where[prismaField] = { lt: value }; break;
          case 'le': where[prismaField] = { lte: value }; break;
        }
      }
    }
    return where;
  }

  private parseFilterValue(val: string): any {
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      return val.slice(1, -1);
    }
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
    if (val.toLowerCase() === 'null') return null;
    if (/^\d+$/.test(val)) return parseInt(val, 10);
    if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
    return val;
  }

  private parseOdataOrderby(orderbyStr: string): Record<string, 'asc' | 'desc'>[] {
    const orderBy: Record<string, 'asc' | 'desc'>[] = [];
    const parts = orderbyStr.split(',');

    for (const part of parts) {
      const tokens = part.trim().split(/\s+/);
      const field = tokens[0];
      if (!field || !ALLOWED_ORDER_FIELDS.includes(field)) continue;
      const prismaField = FIELD_MAP[field] || field;
      const dir = tokens[1]?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      orderBy.push({ [prismaField]: dir });
    }
    return orderBy;
  }

  async create(userId: number, dto: CreateApplicationDto) {
    const appDto = (dto as any).application || dto;
    const count = await this.prisma.application.count({ where: { userId } });
    const year = new Date().getFullYear();
    const appNumber = `AL-${year}-${String(count + 1).padStart(5, '0')}`;

    const application = await this.prisma.$transaction(async (tx) => {
      const loanAmount = appDto.loan_details?.amount ?? appDto.loanAmount ?? undefined;
      const downPayment = appDto.loan_details?.down_payment ?? appDto.downPayment ?? undefined;
      const loanTerm = appDto.loan_details?.term ?? appDto.loanTerm ?? undefined;
      const dob = appDto.personal_info?.dob ?? appDto.dob;

      const app = await tx.application.create({
        data: {
          userId,
          applicationNumber: appNumber,
          currentStep: appDto.current_step || 1,
          loanAmount,
          downPayment,
          loanTerm,
          dob: dob ? new Date(dob) : undefined,
          ssnEncrypted: appDto.personal_info?.ssn || undefined,
        },
      });

      if (appDto.personal_info?.address) {
        const pi = appDto.personal_info;
        await tx.address.create({
          data: {
            applicationId: app.id,
            addressType: 'residential',
            streetAddress: pi.address,
            city: pi.city || '',
            state: pi.state || '',
            zipCode: pi.zip || '',
            yearsAtAddress: pi.years_at_address ? Number(pi.years_at_address) : 0,
            monthsAtAddress: pi.months_at_address ? Number(pi.months_at_address) : 0,
          },
        });
      }

      if (appDto.car_details?.make) {
        const cd = appDto.car_details;
        const condition = this.normalizeCondition(cd.condition);
        await tx.vehicle.create({
          data: {
            applicationId: app.id,
            make: cd.make,
            model: cd.model || 'Unknown',
            year: Number(cd.year) > 0 ? Number(cd.year) : new Date().getFullYear(),
            vin: cd.vin || undefined,
            trim: cd.trim || undefined,
            condition,
            estimatedValue: cd.price ? Number(cd.price) : undefined,
            mileage: cd.mileage ? Number(cd.mileage) : undefined,
          },
        });
      }

      if (appDto.employment_info) {
        const ei = appDto.employment_info;
        const annualIncome = ei.income ? Number(ei.income) : undefined;
        await tx.financialInfo.create({
          data: {
            applicationId: app.id,
            incomeType: 'primary',
            employerName: ei.employer || undefined,
            jobTitle: ei.job_title || undefined,
            employmentStatus: ei.employment_status || undefined,
            yearsEmployed: ei.years ? Number(ei.years) : undefined,
            monthsEmployed: ei.months_employed ? Number(ei.months_employed) : undefined,
            annualIncome,
            monthlyIncome: annualIncome ? annualIncome / 12 : undefined,
            monthlyExpenses: ei.expenses ? Number(ei.expenses) : undefined,
            creditScore: Number(ei.credit_score) > 0 ? Number(ei.credit_score) : undefined,
            otherIncome: ei.other_income ? Number(ei.other_income) : undefined,
          },
        });
      }

      return app;
    });

    return application;
  }

  async findAllForUser(userId: number, query?: ApplicationQuery) {
    const where: any = { userId };
    const orderBy: any[] = [{ createdAt: 'desc' }];

    if (query?.status) {
      where.status = query.status;
    }
    if (query?.$filter) {
      Object.assign(where, this.parseOdataFilter(query.$filter));
    }

    const finalOrderBy = query?.$orderby ? this.parseOdataOrderby(query.$orderby) : orderBy;

    const page = query?.page && query.page > 0 ? query.page : 1;
    const perPage = query?.per_page && query.per_page > 0 ? Math.min(query.per_page, 100) : 25;

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: finalOrderBy.length > 0 ? finalOrderBy : orderBy,
        include: LIST_INCLUDES,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.application.count({ where }),
    ]);

    return { data, pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } };
  }

  async findAll(query?: ApplicationQuery) {
    const where: any = {};
    const orderBy: any[] = [{ createdAt: 'desc' }];

    if (query?.status) {
      where.status = query.status;
    }
    if (query?.$filter) {
      Object.assign(where, this.parseOdataFilter(query.$filter));
    }

    const finalOrderBy = query?.$orderby ? this.parseOdataOrderby(query.$orderby) : orderBy;

    const page = query?.page && query.page > 0 ? query.page : 1;
    const perPage = query?.per_page && query.per_page > 0 ? Math.min(query.per_page, 100) : 25;

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: finalOrderBy.length > 0 ? finalOrderBy : orderBy,
        include: LIST_INCLUDES,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.application.count({ where }),
    ]);

    return { data, pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } };
  }

  async findOne(id: number, userId?: number, role?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        documents: true,
        addresses: true,
        vehicles: true,
        financialInfos: true,
        statusHistories: { orderBy: { createdAt: 'desc' }, include: { user: true } },
      },
    });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    if (role === 'customer' && application.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return application;
  }

  async update(id: number, userId: number, dto: CreateApplicationDto) {
    const appDto = (dto as any).application || dto;

    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    if (application.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (application.status !== 'draft') {
      throw new UnprocessableEntityException('Only draft applications can be updated');
    }

    return this.prisma.$transaction(async (tx) => {
      const loanAmount = appDto.loan_details?.amount ?? appDto.loanAmount ?? application.loanAmount;
      const downPayment = appDto.loan_details?.down_payment ?? appDto.downPayment ?? application.downPayment;
      const loanTerm = appDto.loan_details?.term ?? appDto.loanTerm ?? application.loanTerm;
      const dob = appDto.personal_info?.dob ?? appDto.dob;

      const updated = await tx.application.update({
        where: { id },
        data: {
          currentStep: appDto.current_step ?? application.currentStep,
          loanAmount,
          downPayment,
          loanTerm,
          dob: dob ? new Date(dob) : application.dob,
          ssnEncrypted: appDto.personal_info?.ssn ?? application.ssnEncrypted,
        },
      });

      if (appDto.personal_info?.address) {
        const pi = appDto.personal_info;
        const existing = await tx.address.findFirst({
          where: { applicationId: id, addressType: 'residential' },
        });
        const addrData = {
          streetAddress: pi.address,
          city: pi.city || '',
          state: pi.state || '',
          zipCode: pi.zip || '',
          yearsAtAddress: pi.years_at_address ? Number(pi.years_at_address) : 0,
          monthsAtAddress: pi.months_at_address ? Number(pi.months_at_address) : 0,
        };
        if (existing) {
          await tx.address.update({ where: { id: existing.id }, data: addrData });
        } else {
          await tx.address.create({ data: { ...addrData, applicationId: id, addressType: 'residential' } });
        }
      }

      if (appDto.car_details?.make) {
        const cd = appDto.car_details;
        const condition = this.normalizeCondition(cd.condition);
        const existingVehicle = await tx.vehicle.findUnique({ where: { applicationId: id } });
        const vehicleData = {
          make: cd.make,
          model: cd.model || 'Unknown',
          year: Number(cd.year) > 0 ? Number(cd.year) : new Date().getFullYear(),
          vin: cd.vin || undefined,
          trim: cd.trim || undefined,
          condition,
          estimatedValue: cd.price ? Number(cd.price) : undefined,
          mileage: cd.mileage ? Number(cd.mileage) : undefined,
        };
        if (existingVehicle) {
          await tx.vehicle.update({ where: { id: existingVehicle.id }, data: vehicleData });
        } else {
          await tx.vehicle.create({ data: { ...vehicleData, applicationId: id } });
        }
      }

      if (appDto.employment_info) {
        const ei = appDto.employment_info;
        const annualIncome = ei.income ? Number(ei.income) : undefined;
        const fiData = {
          employerName: ei.employer || undefined,
          jobTitle: ei.job_title || undefined,
          employmentStatus: ei.employment_status || undefined,
          yearsEmployed: ei.years ? Number(ei.years) : undefined,
          monthsEmployed: ei.months_employed ? Number(ei.months_employed) : undefined,
          annualIncome,
          monthlyIncome: annualIncome ? annualIncome / 12 : undefined,
          monthlyExpenses: ei.expenses ? Number(ei.expenses) : undefined,
          creditScore: Number(ei.credit_score) > 0 ? Number(ei.credit_score) : undefined,
          otherIncome: ei.other_income ? Number(ei.other_income) : undefined,
        };
        const existingFi = await tx.financialInfo.findFirst({
          where: { applicationId: id, incomeType: 'primary' },
        });
        if (existingFi) {
          await tx.financialInfo.update({ where: { id: existingFi.id }, data: fiData });
        } else {
          await tx.financialInfo.create({ data: { ...fiData, applicationId: id, incomeType: 'primary' } });
        }
      }

      return updated;
    });
  }

  async remove(id: number, userId: number) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    if (application.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (application.status !== 'draft') {
      throw new UnprocessableEntityException('Only draft applications can be deleted');
    }
    await this.prisma.application.delete({ where: { id } });
    return { message: 'Application deleted' };
  }

  async updateStatus(id: number, status: ApplicationStatus, userId: number) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    const fromStatus = application.status;
    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        status,
        decidedAt: ['approved', 'rejected'].includes(status) ? new Date() : undefined,
      },
    });
    await this.prisma.statusHistory.create({
      data: { applicationId: id, userId, fromStatus, toStatus: status },
    });
    const user = await this.prisma.user.findUnique({ where: { id: application.userId } });
    if (user?.email) {
      if (status === 'approved') {
        await this.notifications.notifyApplicationApproved(user.email, application.applicationNumber ?? '');
      } else if (status === 'rejected') {
        await this.notifications.notifyApplicationRejected(user.email, application.applicationNumber ?? '');
      } else {
        await this.notifications.notifyStatusChange(user.email, application.applicationNumber ?? '', fromStatus, status);
      }
    }
    return updated;
  }

  private normalizeCondition(condition?: string): string | undefined {
    if (!condition) return undefined;
    if (condition === 'used_certified') return 'certified';
    return ['new', 'used', 'certified'].includes(condition) ? condition : undefined;
  }
}

const ALLOWED_SELECT_FIELDS = ['id', 'application_number', 'status', 'current_step', 'loan_amount', 'down_payment', 'loan_term', 'interest_rate', 'monthly_payment', 'created_at', 'updated_at', 'submitted_at', 'decided_at'];

export function applyOdataSelect<T extends Record<string, any>>(data: T[], selectStr?: string): T[] {
  if (!selectStr) return data;
  const fields = selectStr.split(',').map((f) => f.trim()).filter((f) => ALLOWED_SELECT_FIELDS.includes(f));
  if (fields.length === 0) return data;
  if (!fields.includes('id')) fields.unshift('id');
  return data.map((item) => {
    const picked: Record<string, any> = {};
    for (const field of fields) {
      if (field in item) picked[field] = item[field];
    }
    return picked as T;
  });
}
