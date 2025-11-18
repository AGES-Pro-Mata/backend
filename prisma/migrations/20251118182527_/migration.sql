/*
  Warnings:

  - You are about to drop the column `userId` on the `Requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Requests" DROP CONSTRAINT "Requests_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Requests" DROP COLUMN "userId";
