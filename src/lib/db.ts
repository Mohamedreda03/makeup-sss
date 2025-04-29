import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = (() => {
  try {
    return (
      globalForPrisma.prisma ??
      new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
      })
    );
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    throw new Error("Database connection failed");
  }
})();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
