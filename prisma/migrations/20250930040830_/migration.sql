/*
  Warnings:

  - Made the column `reservationId` on table `Requests` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Requests" DROP CONSTRAINT "Requests_reservationId_fkey";

-- AlterTable
ALTER TABLE "public"."Requests" ALTER COLUMN "reservationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Requests" ADD CONSTRAINT "Requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
