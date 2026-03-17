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

    return {
      data: data.map((person) => ({
        id: person.id,
        name: person.name,
        seafarercode: person.seamancode,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      })),
      total,
    };
  }

  async findBySeafarerCode(seafarercode: string) {
    const person = await this.prisma.person.findFirst({
      where: { seamancode: seafarercode },
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!person) return null;

    return {
      id: person.id,
      name: person.name,
      seafarercode: person.seamancode,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    };
  }

  async findById(id: string) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!person) return null;

    return {
      id: person.id,
      name: person.name,
      seafarercode: person.seamancode,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    };
  }

  async create(data: { name: string; seafarercode: string }) {
    const person = await this.prisma.person.create({
      data: {
        name: data.name,
        seamancode: data.seafarercode,
      },
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: person.id,
      name: person.name,
      seafarercode: person.seamancode,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    };
  }

  async update(id: string, data: { name?: string; seafarercode?: string }) {
    const person = await this.prisma.person.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.seafarercode !== undefined ? { seamancode: data.seafarercode } : {}),
      },
      select: {
        id: true,
        name: true,
        seamancode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: person.id,
      name: person.name,
      seafarercode: person.seamancode,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    };
  }

  async delete(id: string) {
    const person = await this.prisma.person.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        seamancode: true,
      },
    });

    return {
      id: person.id,
      name: person.name,
      seafarercode: person.seamancode,
    };
  }

  async getStats() {
    const [totalSeafarers, totalCertificates] = await Promise.all([
      this.prisma.person.count(),
      this.prisma.certificate.count(),
    ]);
    return { totalSeafarers, totalCertificates };
  }
}
