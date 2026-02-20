// apps/backend/src/documents/documents.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DocumentType, DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(applicationId: number, _userId: number, file: Express.Multer.File, docType: string) {
    if (!file) throw new BadRequestException('No file provided');
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException(`Application #${applicationId} not found`);

    return this.prisma.document.create({
      data: {
        applicationId,
        docType: docType as DocumentType,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename ?? file.originalname}`,
        fileSize: file.size,
        contentType: file.mimetype,
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

  async updateStatus(id: number, status: string, userId: number, rejectionNote?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Document #${id} not found`);

    return this.prisma.document.update({
      where: { id },
      data: {
        status: status as DocumentStatus,
        rejectionNote: rejectionNote ?? null,
        verifiedAt: status === 'verified' ? new Date() : undefined,
        verifiedById: status === 'verified' ? userId : undefined,
      },
    });
  }
}
