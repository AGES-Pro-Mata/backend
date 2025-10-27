/*
  Warnings:

  - You are about to drop the `_MemberToReservation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `membersCount` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_MemberToReservation" DROP CONSTRAINT "_MemberToReservation_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_MemberToReservation" DROP CONSTRAINT "_MemberToReservation_B_fkey";

-- AlterTable
ALTER TABLE "public"."Experience" ADD COLUMN     "professorShouldPay" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "membersCount" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."_MemberToReservation";
