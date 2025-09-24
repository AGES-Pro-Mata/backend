-- CreateEnum
CREATE TYPE "public"."RequestType" AS ENUM ('CREATED', 'CANCELED', 'CANCELED_REQUESTED', 'EDITED', 'REJECTED', 'APPROVED', 'PEOPLE_REQUESTED', 'PAYMENT_REQUESTED', 'PEOPLE_SENT', 'PAYMENT_SENT');

-- CreateTable
CREATE TABLE "public"."Requests" (
    "id" TEXT NOT NULL,
    "type" "public"."RequestType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,
    "description" TEXT,
    "reservationId" TEXT,

    CONSTRAINT "Requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Requests" ADD CONSTRAINT "Requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Requests" ADD CONSTRAINT "Requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
