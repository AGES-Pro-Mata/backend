-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."RequestType" ADD VALUE 'DOCUMENT_REQUESTED';
ALTER TYPE "public"."RequestType" ADD VALUE 'DOCUMENT_APPROVED';
ALTER TYPE "public"."RequestType" ADD VALUE 'DOCUMENT_REJECTED';

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_url_key" ON "public"."Document"("url");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
