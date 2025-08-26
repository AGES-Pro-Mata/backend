/*
  Warnings:

  - The values [STUDENT_PUCRS,TEACHER,EXTERNAL_STUDENT,EXTERNAL_TEACHER,GENERAL_PUBLIC] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cep` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fundation` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_number` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[addressId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dob` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cpf` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserType_new" AS ENUM ('ADMIN', 'ROOT', 'GUEST', 'PROFESSOR');
ALTER TABLE "public"."User" ALTER COLUMN "user_type" TYPE "public"."UserType_new" USING ("user_type"::text::"public"."UserType_new");
ALTER TYPE "public"."UserType" RENAME TO "UserType_old";
ALTER TYPE "public"."UserType_new" RENAME TO "UserType";
DROP TYPE "public"."UserType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "address",
DROP COLUMN "cep",
DROP COLUMN "city",
DROP COLUMN "fundation",
DROP COLUMN "role",
DROP COLUMN "user_number",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "addressId" INTEGER,
ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "institution" TEXT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "cpf" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" SERIAL NOT NULL,
    "street" TEXT,
    "number" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_addressId_key" ON "public"."User"("addressId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
