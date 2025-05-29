-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "total_price" DOUBLE PRECISION;
