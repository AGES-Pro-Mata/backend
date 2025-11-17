/*
  Warnings:

  - You are about to drop the column `notes` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Reservation" DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "public"."ReservationGroup" ADD COLUMN     "notes" TEXT;
