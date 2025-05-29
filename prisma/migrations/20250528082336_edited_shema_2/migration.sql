/*
  Warnings:

  - The `availability` column on the `makeup_artists` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "makeup_artists" ALTER COLUMN "pricing" DROP NOT NULL,
ALTER COLUMN "experience_years" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
DROP COLUMN "availability",
ADD COLUMN     "availability" BOOLEAN NOT NULL DEFAULT false;
