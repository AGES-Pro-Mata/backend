/*
  Warnings:

  - The values [EDIT_REQUESTED] on the enum `RequestType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."RequestType_new" AS ENUM ('CREATED', 'CANCELED', 'CANCELED_REQUESTED', 'EDITED', 'REJECTED', 'APPROVED', 'PEOPLE_REQUESTED', 'PAYMENT_REQUESTED', 'PEOPLE_SENT', 'PAYMENT_SENT', 'PAYMENT_REJECTED', 'DOCUMENT_REQUESTED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED');
ALTER TABLE "public"."Requests" ALTER COLUMN "type" TYPE "public"."RequestType_new" USING ("type"::text::"public"."RequestType_new");
ALTER TYPE "public"."RequestType" RENAME TO "RequestType_old";
ALTER TYPE "public"."RequestType_new" RENAME TO "RequestType";
DROP TYPE "public"."RequestType_old";
COMMIT;
