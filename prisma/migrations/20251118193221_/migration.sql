/*
  Warnings:

  - A unique constraint covering the columns `[receiptId]` on the table `ReservationGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."RequestType" ADD VALUE 'PAYMENT_APPROVED';

-- AlterTable
ALTER TABLE "public"."ReservationGroup" ADD COLUMN     "receiptId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ReservationGroup_receiptId_key" ON "public"."ReservationGroup"("receiptId");

-- AddForeignKey
ALTER TABLE "public"."ReservationGroup" ADD CONSTRAINT "ReservationGroup_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "public"."Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
