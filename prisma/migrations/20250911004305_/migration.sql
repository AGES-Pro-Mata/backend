-- CreateEnum
CREATE TYPE "public"."WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "public"."TrailDifficulty" AS ENUM ('LIGHT', 'MODERATED', 'HEAVY', 'EXTREME');

-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('TRAIL', 'HOSTING', 'LABORATORY', 'EVENT');

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Experience" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."Category" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "price" DECIMAL(65,30),
    "weekDays" "public"."WeekDay"[],
    "durationMinutes" INTEGER,
    "trailDifficulty" "public"."TrailDifficulty",
    "trailLength" DOUBLE PRECISION,
    "imageId" TEXT,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_url_key" ON "public"."Image"("url");

-- AddForeignKey
ALTER TABLE "public"."Experience" ADD CONSTRAINT "Experience_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
