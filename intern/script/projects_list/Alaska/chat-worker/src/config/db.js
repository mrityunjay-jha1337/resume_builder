import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma (PgBouncer)");
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

export { prisma };
