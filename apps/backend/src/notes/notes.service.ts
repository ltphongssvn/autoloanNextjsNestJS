// apps/backend/src/notes/notes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(applicationId: number, userId: number, note: string, internal = false) {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }

    return this.prisma.applicationNote.create({
      data: { applicationId, userId, note, internal },
      include: { user: true },
    });
  }

  async findByApplication(applicationId: number) {
    return this.prisma.applicationNote.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }
}
