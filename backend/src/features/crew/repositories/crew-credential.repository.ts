import { PrismaClient } from '@prisma/client';

export class CrewCredentialRepository {
  constructor(private prisma: PrismaClient) {}

  async findByPersonId(personId: string) {
    return this.prisma.crewCredential.findUnique({
      where: { personId },
      select: {
        id: true,
        personId: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: { personId: string; passwordHash: string }) {
    return this.prisma.crewCredential.create({
      data: {
        personId: data.personId,
        passwordHash: data.passwordHash,
      },
      select: {
        id: true,
        personId: true,
        createdAt: true,
      },
    });
  }

  async updatePassword(personId: string, passwordHash: string) {
    return this.prisma.crewCredential.update({
      where: { personId },
      data: { passwordHash },
      select: {
        id: true,
        personId: true,
        updatedAt: true,
      },
    });
  }
}
