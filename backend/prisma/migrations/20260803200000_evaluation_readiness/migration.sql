-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('INSUFFICIENT', 'IN_PROGRESS', 'READY');

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "readinessStatus" "ReadinessStatus" NOT NULL DEFAULT 'INSUFFICIENT';
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "readiness" JSONB;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "priority" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "configVersion" TEXT;