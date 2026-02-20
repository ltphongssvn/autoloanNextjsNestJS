// apps/backend/src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      created_at: user.createdAt.toISOString(),
    };
  }

  async updateProfile(id: number, data: { first_name?: string; last_name?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.first_name ?? user.firstName,
        lastName: data.last_name ?? user.lastName,
        phone: data.phone ?? user.phone,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      first_name: updated.firstName,
      last_name: updated.lastName,
      full_name: `${updated.firstName} ${updated.lastName}`,
      phone: updated.phone,
      created_at: updated.createdAt.toISOString(),
    };
  }
}
