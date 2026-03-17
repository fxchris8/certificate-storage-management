import { PrismaClient } from '@prisma/client';

export class CertificateRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findBySeafarerCode(seafarerCode: string, params?: { skip?: number; take?: number; search?: string }) {
    const { skip, take, search } = params || {};
    const where: any = {
      person: { seamancode: seafarerCode },
    };

    if (search) {
      where.AND = {
         OR: [
          { certificateName: { contains: search, mode: 'insensitive' } },
          { nomorSertifikat: { contains: search, mode: 'insensitive' } },
        ]
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.certificate.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          personId: true,
          certificateName: true,
          nomorSertifikat: true,
          fileUrl: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return { data, total };
  }

  async checkMandatoryDocs(seafarerCode: string): Promise<{ hasIjazah: boolean; hasEndorse: boolean; hasMedicalCheckup: boolean }> {
    const baseWhere = { person: { seamancode: seafarerCode } };

    const [ijazah, endorse, medical] = await Promise.all([
      this.prisma.certificate.findFirst({ where: { ...baseWhere, certificateName: 'Ijazah' }, select: { id: true } }),
      this.prisma.certificate.findFirst({ where: { ...baseWhere, certificateName: 'Endorse' }, select: { id: true } }),
      this.prisma.certificate.findFirst({ where: { ...baseWhere, certificateName: 'Medical Checkup' }, select: { id: true } }),
    ]);

    return {
      hasIjazah: !!ijazah,
      hasEndorse: !!endorse,
      hasMedicalCheckup: !!medical,
    };
  }

  async findById(id: string) {
    return this.prisma.certificate.findUnique({
      where: { id },
      select: {
        id: true,
        personId: true,
        certificateName: true,
        nomorSertifikat: true,
        fileUrl: true,
        uploadedAt: true,
      },
    });
  }

  async findBySeafarerCodeAndNomor(seafarerCode: string, nomorSertifikat: string) {
    return this.prisma.certificate.findFirst({
      where: {
        nomorSertifikat,
        person: { seamancode: seafarerCode },
      },
      select: {
        id: true,
        personId: true,
        certificateName: true,
        nomorSertifikat: true,
        fileUrl: true,
        uploadedAt: true,
      },
    });
  }

  async create(data: { personId: string; certificateName: string; nomorSertifikat: string; fileUrl: string }) {
    return this.prisma.certificate.create({
      data,
      select: {
        id: true,
        personId: true,
        certificateName: true,
        nomorSertifikat: true,
        fileUrl: true,
        uploadedAt: true,
      },
    });
  }

  async update(id: string, data: { certificateName?: string; nomorSertifikat?: string; fileUrl?: string }) {
    return this.prisma.certificate.update({
      where: { id },
      data,
      select: {
        id: true,
        personId: true,
        certificateName: true,
        nomorSertifikat: true,
        fileUrl: true,
        uploadedAt: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.certificate.delete({
      where: { id },
      select: {
        id: true,
        certificateName: true,
        nomorSertifikat: true,
        fileUrl: true,
      },
    });
  }

  async findPersonBySeafarerCode(seafarerCode: string) {
    const person = await this.prisma.person.findFirst({
      where: { seamancode: seafarerCode },
      select: { id: true, name: true, seamancode: true },
    });

    if (!person) return null;

    return {
      id: person.id,
      name: person.name,
      seafarercode: person.seamancode,
    };
  }
}
