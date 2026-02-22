// apps/backend/src/documents/documents.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(applicationId: number, userId: number, file: Express.Multer.File, docType: string) {
    const doc = await this.prisma.document.create({
      data: {
        applicationId,
        docType: docType as any,
        fileName: file.originalname,
        fileSize: file.size,
        contentType: file.mimetype,
        fileUrl: `/uploads/${file.filename || file.originalname}`,
        status: 'uploaded',
        uploadedAt: new Date(),
      },
    });
    return this.withDownloadUrl(doc, applicationId);
  }

  async findByApplication(applicationId: number) {
    const docs = await this.prisma.document.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((doc) => this.withDownloadUrl(doc, applicationId));
  }

  async findOne(id: number) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document #${id} not found`);
    }
    return this.withDownloadUrl(doc, doc.applicationId);
  }

  async remove(id: number, userId: number) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { application: true },
    });
    if (!doc) {
      throw new NotFoundException(`Document #${id} not found`);
    }
    if (doc.application.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  async updateStatus(id: number, status: string, verifiedById: number, rejectionNote?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document #${id} not found`);
    }
    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status: status as any,
        verifiedById,
        verifiedAt: status === 'verified' ? new Date() : undefined,
        rejectionNote: rejectionNote ?? doc.rejectionNote,
      },
    });
    return this.withDownloadUrl(updated, updated.applicationId);
  }

  private withDownloadUrl(doc: any, applicationId: number) {
    return {
      ...doc,
      download_url: doc.fileUrl
        ? `/api/v1/applications/${applicationId}/documents/${doc.id}/download`
        : null,
    };
  }
}
