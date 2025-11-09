import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma client instance to prevent multiple instances in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Get or create a singleton Prisma client instance
 *
 * This pattern prevents multiple Prisma client instances from being created
 * during hot reloads in Next.js development mode, which can exhaust database
 * connections.
 *
 * @returns Singleton PrismaClient instance
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
