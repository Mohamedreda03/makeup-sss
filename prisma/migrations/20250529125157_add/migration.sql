/*
  Warnings:

  - You are about to drop the column `duration` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "duration",
DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
