// apps/backend/src/notes/notes.module.ts
import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, PrismaService],
  exports: [NotesService],
})
export class NotesModule {}
