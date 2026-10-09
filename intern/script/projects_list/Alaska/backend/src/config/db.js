import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.prismaGlobal || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
