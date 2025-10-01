/*
  Warnings:

  - You are about to drop the column `reservationId` on the `Requests` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `reservationGroupId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Requests" DROP CONSTRAINT "Requests_reservationId_fkey";

-- AlterTable
ALTER TABLE "public"."Requests" DROP COLUMN "reservationId",
ADD COLUMN     "reservationGroupId" TEXT;

-- AlterTable
ALTER TABLE "public"."Reservation" DROP COLUMN "status",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reservationGroupId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "gender" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reservationGroupId" TEXT NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReservationGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReservationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_MemberToReservation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberToReservation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_reservationGroupId_document_key" ON "public"."Member"("reservationGroupId", "document");

-- CreateIndex
CREATE INDEX "_MemberToReservation_B_index" ON "public"."_MemberToReservation"("B");

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_reservationGroupId_fkey" FOREIGN KEY ("reservationGroupId") REFERENCES "public"."ReservationGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Requests" ADD CONSTRAINT "Requests_reservationGroupId_fkey" FOREIGN KEY ("reservationGroupId") REFERENCES "public"."ReservationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_reservationGroupId_fkey" FOREIGN KEY ("reservationGroupId") REFERENCES "public"."ReservationGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReservationGroup" ADD CONSTRAINT "ReservationGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemberToReservation" ADD CONSTRAINT "_MemberToReservation_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MemberToReservation" ADD CONSTRAINT "_MemberToReservation_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
