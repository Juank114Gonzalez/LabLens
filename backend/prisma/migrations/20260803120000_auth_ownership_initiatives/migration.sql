-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'EVALUATED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "InitiativeStatus" NOT NULL DEFAULT 'DRAFT',
    "currentEvaluationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" UUID NOT NULL,
    "initiativeId" UUID NOT NULL,
    "fit" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "alignment" INTEGER NOT NULL,
    "dataAvailability" INTEGER NOT NULL,
    "complexity" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Initiative_currentEvaluationId_key" ON "Initiative"("currentEvaluationId");

-- CreateIndex
CREATE INDEX "Initiative_userId_updatedAt_idx" ON "Initiative"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Evaluation_initiativeId_createdAt_idx" ON "Evaluation"("initiativeId", "createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (circular: Initiative.currentEvaluationId → Evaluation)
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_currentEvaluationId_fkey" FOREIGN KEY ("currentEvaluationId") REFERENCES "Evaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- System user for orphan conversations (password is intentionally unusable)
INSERT INTO "User" ("id", "name", "email", "passwordHash", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Migrated User',
  'migrated@lablens.local',
  '$2b$10$29oXel2xB54fbHEqQBuzUODMuAFcDw6WPL.coPq2DMI6Ur/YRdljy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Extend Conversation
ALTER TABLE "Conversation" ADD COLUMN "userId" UUID;
ALTER TABLE "Conversation" ADD COLUMN "initiativeId" UUID;
ALTER TABLE "Conversation" ADD COLUMN "title" TEXT;

-- Assign orphan conversations to system user
UPDATE "Conversation"
SET "userId" = '00000000-0000-4000-8000-000000000001'
WHERE "userId" IS NULL;

-- Backfill Initiative + Evaluation from legacy evaluation JSON
DO $$
DECLARE
  conv RECORD;
  new_initiative_id UUID;
  new_evaluation_id UUID;
  eval_fit INTEGER;
  eval_impact INTEGER;
  eval_alignment INTEGER;
  eval_data INTEGER;
  eval_complexity INTEGER;
  eval_summary TEXT;
  eval_recommendations JSONB;
  initiative_title TEXT;
  initiative_data_title TEXT;
BEGIN
  FOR conv IN
    SELECT c.*
    FROM "Conversation" c
    WHERE c."evaluation" IS NOT NULL
  LOOP
    new_initiative_id := gen_random_uuid();
    new_evaluation_id := gen_random_uuid();

    initiative_data_title := NULLIF(conv."initiativeData"->>'title', '');
    initiative_title := COALESCE(initiative_data_title, 'Iniciativa migrada');

    eval_fit := COALESCE((conv."evaluation"->>'fit')::INTEGER, 0);
    eval_impact := COALESCE((conv."evaluation"->'scores'->>'impact')::INTEGER, 0);
    eval_alignment := COALESCE((conv."evaluation"->'scores'->>'alignment')::INTEGER, 0);
    eval_data := COALESCE((conv."evaluation"->'scores'->>'data')::INTEGER, 0);
    eval_complexity := COALESCE((conv."evaluation"->'scores'->>'complexity')::INTEGER, 0);
    eval_summary := COALESCE(conv."evaluation"->>'summary', 'Evaluación migrada');
    eval_recommendations := COALESCE(conv."evaluation"->'recommendations', '[]'::JSONB);

    INSERT INTO "Initiative" (
      "id", "userId", "title", "status", "currentEvaluationId", "createdAt", "updatedAt"
    ) VALUES (
      new_initiative_id,
      conv."userId",
      initiative_title,
      'EVALUATED',
      NULL,
      conv."createdAt",
      conv."updatedAt"
    );

    INSERT INTO "Evaluation" (
      "id", "initiativeId", "fit", "impact", "alignment", "dataAvailability",
      "complexity", "summary", "recommendations", "createdAt"
    ) VALUES (
      new_evaluation_id,
      new_initiative_id,
      eval_fit,
      eval_impact,
      eval_alignment,
      eval_data,
      eval_complexity,
      eval_summary,
      eval_recommendations,
      conv."updatedAt"
    );

    UPDATE "Initiative"
    SET "currentEvaluationId" = new_evaluation_id
    WHERE "id" = new_initiative_id;

    UPDATE "Conversation"
    SET
      "initiativeId" = new_initiative_id,
      "title" = initiative_title
    WHERE "id" = conv."id";
  END LOOP;

  -- Titles from initiativeData for conversations without evaluation
  UPDATE "Conversation"
  SET "title" = NULLIF("initiativeData"->>'title', '')
  WHERE "title" IS NULL
    AND "initiativeData"->>'title' IS NOT NULL
    AND "initiativeData"->>'title' <> '';
END $$;

ALTER TABLE "Conversation" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Conversation" DROP COLUMN "initiativeData";
ALTER TABLE "Conversation" DROP COLUMN "evaluation";

CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");
CREATE INDEX "Conversation_initiativeId_idx" ON "Conversation"("initiativeId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
