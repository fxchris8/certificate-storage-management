import { PrismaClient, ExternalSubmission } from '@prisma/client';
import { CreateExternalSubmissionInput } from '../types/external-submission.types.js';

export class ExternalSubmissionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateExternalSubmissionInput): Promise<ExternalSubmission> {
    const person = await this.prisma.person.findFirst({
      where: { seamancode: data.seamanCode },
    });

    return this.prisma.externalSubmission.create({
      data: {
        externalSubmissionId: data.externalSubmissionId,
        seamanCode: data.seamanCode,
        seamanName: data.seamanName,
        certificateName: data.certificateName,
        nomorSertifikat: data.nomorSertifikat,
        externalFileUrl: data.externalFileUrl,
        personId: person?.id,
      },
    });
  }

  async findAll(page?: number, limit?: number, status?: string, search?: string): Promise<ExternalSubmission[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { seamanCode: { contains: search, mode: 'insensitive' } },
        { seamanName: { contains: search, mode: 'insensitive' } },
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

  async count(status?: string, search?: string): Promise<number> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { seamanCode: { contains: search, mode: 'insensitive' } },
        { seamanName: { contains: search, mode: 'insensitive' } },
        { certificateName: { contains: search, mode: 'insensitive' } },
        { nomorSertifikat: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.externalSubmission.count({ where });
  }

  async findById(id: string): Promise<ExternalSubmission | null> {
    return this.prisma.externalSubmission.findUnique({
      where: { id },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    reviewNotes: string,
    reviewedBy: string
  ): Promise<ExternalSubmission> {
    return this.prisma.externalSubmission.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });
  }
}
