// apps/backend/src/documents/documents.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DocumentType, DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(applicationId: number, userId: number, fileName: string, docType: DocumentType, fileUrl: string, fileSize?: number, contentType?: string) {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }
    if (application.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.document.create({
      data: {
        applicationId,
        fileName,
        docType,
        fileUrl,
        fileSize,
        contentType,
        status: 'pending' as DocumentStatus,
        uploadedAt: new Date(),
      },
    });
  }

  async findByApplication(applicationId: number) {
    return this.prisma.document.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: number, status: DocumentStatus, verifiedById?: number) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document #${id} not found`);
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedById,
        verifiedAt: verifiedById ? new Date() : undefined,
      },
    });
  }
}
