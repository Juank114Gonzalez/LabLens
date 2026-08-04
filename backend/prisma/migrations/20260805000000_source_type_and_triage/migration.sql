-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SourceType') THEN
        CREATE TYPE "SourceType" AS ENUM ('INTERNAL', 'EXTERNAL_CONTRACTOR', 'INTERNATIONAL_REFERENCE');
    END IF;
END
$$;

-- AlterEnum
ALTER TYPE "InitiativeStatus" ADD VALUE IF NOT EXISTS 'TRIAGED_LAB';
ALTER TYPE "InitiativeStatus" ADD VALUE IF NOT EXISTS 'TRIAGED_EXTERNAL';

-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "sourceType" "SourceType" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "referenceOrganization" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "referenceEvent" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "referenceLink" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "referenceRationale" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "submitterName" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "submitterEmail" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "triageClassificationId" UUID;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "triageWorkTableId" UUID;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "triageReasoning" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "triageConfidence" DOUBLE PRECISION;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "triagedAt" TIMESTAMP(3);
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "notificationSentAt" TIMESTAMP(3);
ALTER TABLE "Initiative" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkTable" ADD COLUMN IF NOT EXISTS "notificationEmail" TEXT;

-- DropForeignKey
ALTER TABLE "Initiative" DROP CONSTRAINT IF EXISTS "Initiative_userId_fkey";

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_triageClassificationId_fkey" FOREIGN KEY ("triageClassificationId") REFERENCES "IntelligentClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_triageWorkTableId_fkey" FOREIGN KEY ("triageWorkTableId") REFERENCES "WorkTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Initiative_sourceType_idx" ON "Initiative"("sourceType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Initiative_triageClassificationId_idx" ON "Initiative"("triageClassificationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Initiative_triagedAt_idx" ON "Initiative"("triagedAt");
