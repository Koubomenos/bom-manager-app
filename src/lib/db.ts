import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: pg.Pool;
};

function createPrismaClient() {
  // Close any existing pool to prevent connection/memory leaks during HMR
  if (globalForPrisma.pgPool) {
    globalForPrisma.pgPool.end().catch(() => {});
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // Limit pool size to prevent resource exhaustion, especially in dev
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    // Close idle clients after 30s to free memory
    idleTimeoutMillis: 30000,
    // Timeout connecting after 10s
    connectionTimeoutMillis: 10000,
  });

  // Cache the pool on globalThis so we can clean it up on next HMR cycle
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
