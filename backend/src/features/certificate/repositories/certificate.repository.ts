import { PrismaClient } from '@prisma/client';

export class CertificateRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findBySeamanCode(seamanCode: string) {
    return this.prisma.certificate.findMany({
      where: {
        person: { seamancode: seamanCode },
      },
      select: {
        id: true,
        personId: true,
        certificateName: true,
        nomorSertifikat: true,
        fileUrl: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
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

  async findBySeamanCodeAndNomor(seamanCode: string, nomorSertifikat: string) {
    return this.prisma.certificate.findFirst({
      where: {
        nomorSertifikat,
        person: { seamancode: seamanCode },
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

  async findPersonBySeamanCode(seamanCode: string) {
    return this.prisma.person.findFirst({
      where: { seamancode: seamanCode },
      select: { id: true, name: true, seamancode: true },
    });
  }
}
