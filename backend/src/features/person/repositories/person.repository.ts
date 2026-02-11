import { PrismaClient } from '@prisma/client';

export class PersonRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findAll() {
    return this.prisma.person.findMany({
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.person.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: { name: string; seamancode: string }) {
    return this.prisma.person.create({
      data,
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, data: { name?: string; seamancode?: string }) {
    return this.prisma.person.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.person.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        seamancode: true,
      },
    });
  }

  async getStats() {
    const [totalSeafarers, totalCertificates] = await Promise.all([
      this.prisma.person.count(),
      this.prisma.certificate.count(),
    ]);
    return { totalSeafarers, totalCertificates };
  }
}
