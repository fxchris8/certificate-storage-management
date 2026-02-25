import { PrismaClient } from '@prisma/client';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findAllUsers(params?: { skip?: number; take?: number; search?: string }) {
    const { skip, take, search } = params || {};
    const where: any = {};

    if (search) {
      where.username = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createUser(data: { username: string; passwordHash: string }) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
      },
    });
  }

  async findBySsoId(ssoId: string) {
    return this.prisma.user.findUnique({
      where: { ssoId },
      select: {
        id: true,
        username: true,
        ssoId: true,
      },
    });
  }

  async createSsoUser(data: { username: string; ssoId: string }) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        ssoId: true,
      },
    });
  }

  async updateUser(userId: string, data: { username?: string; passwordHash?: string; ssoId?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        username: true,
      },
    });
  }
}

