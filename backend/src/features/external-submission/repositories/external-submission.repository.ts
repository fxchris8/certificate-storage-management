import { ExternalSubmission, PrismaClient } from '@prisma/client';

import { CreateExternalSubmissionInput } from '../types/external-submission.types.js';

export class ExternalSubmissionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateExternalSubmissionInput & { personId?: string }): Promise<ExternalSubmission> {
    const person = await this.prisma.person.findFirst({
      where: { seafarercode: data.seafarerCode },
    });

    return this.prisma.externalSubmission.create({
      data: {
        externalSubmissionId: data.externalSubmissionId,
        seafarerCode: data.seafarerCode,
        seafarerName: data.seafarerName,
        certificateName: data.certificateName,
        nomorSertifikat: data.nomorSertifikat,
        externalFileUrl: data.externalFileUrl,
        personId: data.personId ?? person?.id,
      },
    });
  }

  async findAll(
    page?: number,
    limit?: number,
    status?: string,
    search?: string,
    personId?: string,
    seafarerCode?: string,
  ): Promise<ExternalSubmission[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (personId) {
      where.personId = personId;
    }
    if (seafarerCode) {
      where.seafarerCode = seafarerCode;
    }
    if (search) {
      where.OR = [
        { seafarerCode: { contains: search, mode: 'insensitive' } },
        { seafarerName: { contains: search, mode: 'insensitive' } },
        { certificateName: { contains: search, mode: 'insensitive' } },
        { nomorSertifikat: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (page && limit) {
      return this.prisma.externalSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return this.prisma.externalSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(status?: string, search?: string, personId?: string, seafarerCode?: string): Promise<number> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (personId) {
      where.personId = personId;
    }
    if (seafarerCode) {
      where.seafarerCode = seafarerCode;
    }
    if (search) {
      where.OR = [
        { seafarerCode: { contains: search, mode: 'insensitive' } },
        { seafarerName: { contains: search, mode: 'insensitive' } },
        { certificateName: { contains: search, mode: 'insensitive' } },
        { nomorSertifikat: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.externalSubmission.count({ where });
  }

  async getGroupedSeafarers(
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<{ data: any[]; totalCount: number }> {
    const where: any = search
      ? {
          OR: [
            { seafarerCode: { contains: search, mode: 'insensitive' } },
            { seafarerName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [grouped, pendingGroups, distinctCount] = await Promise.all([
      this.prisma.externalSubmission.groupBy({
        by: ['seafarerCode', 'seafarerName'],
        _max: { createdAt: true },
        where,
        orderBy: { _max: { createdAt: 'desc' } },
        ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      this.prisma.externalSubmission.groupBy({
        by: ['seafarerCode'],
        _count: { _all: true },
        where: { ...where, status: 'PENDING' },
      }),
      this.prisma.externalSubmission.findMany({
        where,
        distinct: ['seafarerCode'],
        select: { seafarerCode: true },
      }),
    ]);

    const pendingMap = new Map(
      pendingGroups.map((g) => [g.seafarerCode, g._count._all]),
    );

    return {
      data: grouped.map((g) => ({
        seafarerCode: g.seafarerCode,
        seafarerName: g.seafarerName,
        pendingSubmissions: pendingMap.get(g.seafarerCode) ?? 0,
        latestActivity: g._max.createdAt,
      })),
      totalCount: distinctCount.length,
    };
  }


  async findById(id: string): Promise<ExternalSubmission | null> {
    return this.prisma.externalSubmission.findUnique({
      where: { id },
    });
  }

  async findByExternalSubmissionId(
    externalSubmissionId: string,
  ): Promise<ExternalSubmission | null> {
    return this.prisma.externalSubmission.findFirst({
      where: { externalSubmissionId },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    reviewNotes: string,
    reviewedBy: string,
    personId?: string,
  ): Promise<ExternalSubmission> {
    return this.prisma.externalSubmission.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedBy,
        reviewedAt: new Date(),
        ...(personId && { personId }),
      },
    });
  }

  async deleteById(id: string): Promise<ExternalSubmission> {
    return this.prisma.externalSubmission.delete({
      where: { id },
    });
  }
}
