import { PrismaClient } from '@prisma/client';

export class PersonRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findAll(params?: { skip?: number; take?: number; search?: string }) {
    const { skip, take, search } = params || {};
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { seamancode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          name: true,
          seamancode: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.person.count({ where }),
    ]);

    return { data, total };
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
