-- CreateEnum
CREATE TYPE "public"."HighlightCategory" AS ENUM ('LABORATORY', 'HOSTING', 'EVENT', 'TRAIL', 'CAROUSEL');

-- CreateTable
CREATE TABLE "public"."Highlight" (
    "id" TEXT NOT NULL,
    "category" "public"."HighlightCategory" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Highlight_category_idx" ON "public"."Highlight"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Highlight_category_order_key" ON "public"."Highlight"("category", "order");
