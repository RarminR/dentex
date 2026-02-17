import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

export async function cleanupDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.client.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
}

export async function disconnectTestDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
  }
}
