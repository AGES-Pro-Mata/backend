-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('STUDENT_PUCRS', 'TEACHER', 'EXTERNAL_STUDENT', 'EXTERNAL_TEACHER', 'GENERAL_PUBLIC', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "user_type" "public"."UserType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "cpf" TEXT,
    "gender" TEXT,
    "rg" TEXT,
    "address" TEXT,
    "city" TEXT,
    "cep" TEXT,
    "user_number" INTEGER,
    "fundation" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "public"."User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "User_rg_key" ON "public"."User"("rg");
