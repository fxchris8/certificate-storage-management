import { PrismaClient } from '@prisma/client';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });
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

  async updateUser(userId: string, data: { username?: string; passwordHash?: string }) {
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

