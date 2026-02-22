// apps/backend/src/applications/applications.service.ts
import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateApplicationDto } from './create-application.dto';
import { ApplicationStatus } from '@prisma/client';
import { NotificationsService } from '../notifications';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: number, dto: CreateApplicationDto) {
    // Support both { application: { ... } } wrapper and flat body
    const appDto = (dto as any).application || dto;

    const count = await this.prisma.application.count({ where: { userId } });
    const appNumber = `AL-${String(count + 1).padStart(6, '0')}`;

    const application = await this.prisma.$transaction(async (tx) => {
      // Determine loan fields from nested or flat
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

      // Save personal_info → address
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

      // Save car_details → vehicle
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

      // Save employment_info → financial_info
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

  async findAllForUser(userId: number) {
    return this.prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
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
      // Determine fields from nested or flat
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

      // Upsert address
      if (appDto.personal_info?.address) {
        const pi = appDto.personal_info;
        const existing = await tx.address.findFirst({
          where: { applicationId: id, addressType: 'residential' },
        });
        if (existing) {
          await tx.address.update({
            where: { id: existing.id },
            data: {
              streetAddress: pi.address,
              city: pi.city || '',
              state: pi.state || '',
              zipCode: pi.zip || '',
              yearsAtAddress: pi.years_at_address ? Number(pi.years_at_address) : 0,
              monthsAtAddress: pi.months_at_address ? Number(pi.months_at_address) : 0,
            },
          });
        } else {
          await tx.address.create({
            data: {
              applicationId: id,
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
      }

      // Upsert vehicle
      if (appDto.car_details?.make) {
        const cd = appDto.car_details;
        const condition = this.normalizeCondition(cd.condition);
        const existingVehicle = await tx.vehicle.findUnique({
          where: { applicationId: id },
        });
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

      // Upsert financial info
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
      data: {
        applicationId: id,
        userId,
        fromStatus,
        toStatus: status,
      },
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
