-- Clean slate: drop previous LabLens domain objects
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Evaluation" CASCADE;
DROP TABLE IF EXISTS "Attachment" CASCADE;
DROP TABLE IF EXISTS "CompanyContact" CASCADE;
DROP TABLE IF EXISTS "Initiative" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "EvaluationCriteria" CASCADE;
DROP TABLE IF EXISTS "IntelligentClassification" CASCADE;
DROP TABLE IF EXISTS "WorkTable" CASCADE;
DROP TYPE IF EXISTS "MessageRole" CASCADE;
DROP TYPE IF EXISTS "ConversationStatus" CASCADE;
DROP TYPE IF EXISTS "InitiativeStatus" CASCADE;
DROP TYPE IF EXISTS "EvaluationStatus" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GENERATOR', 'EVALUATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "InitiativeStatus" AS ENUM ('DRAFT', 'REGISTERED', 'UNDER_REVIEW', 'EVALUATED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('COLLECTING_INFORMATION', 'READY_TO_EVALUATE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GENERATOR',
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
    "status" "InitiativeStatus" NOT NULL DEFAULT 'REGISTERED',
    "diligenciadoPor" TEXT NOT NULL,
    "fechaDiligenciamiento" TIMESTAMP(3) NOT NULL,
    "expectativaSolucion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaProcesoImpactado" TEXT NOT NULL,
    "areaInvolucrada" TEXT NOT NULL,
    "urgencia" TEXT NOT NULL,
    "impacto" TEXT NOT NULL,
    "necesidad" TEXT NOT NULL,
    "porQueAhora" TEXT NOT NULL,
    "paraQue" TEXT NOT NULL,
    "comoSeResuelveHoy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyContact" (
    "id" UUID NOT NULL,
    "initiativeId" UUID NOT NULL,
    "empresa" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" UUID NOT NULL,
    "initiativeId" UUID NOT NULL,
    "publicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" UUID NOT NULL,
    "initiativeId" UUID NOT NULL,
    "evaluatorId" UUID,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "criteriaSnapshot" JSONB,
    "weightsSnapshot" JSONB,
    "results" JSONB,
    "classificationSnapshot" JSONB,
    "workTableSnapshot" JSONB,
    "businessCase" TEXT,
    "recommendations" JSONB,
    "classificationId" UUID,
    "workTableId" UUID,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'COLLECTING_INFORMATION',
    "completion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriteria" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "promptContext" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligentClassification" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "promptContext" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTable" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "promptContext" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Initiative_userId_updatedAt_idx" ON "Initiative"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Initiative_status_idx" ON "Initiative"("status");

-- CreateIndex
CREATE INDEX "CompanyContact_initiativeId_idx" ON "CompanyContact"("initiativeId");

-- CreateIndex
CREATE INDEX "Attachment_initiativeId_idx" ON "Attachment"("initiativeId");

-- CreateIndex
CREATE INDEX "Attachment_publicId_idx" ON "Attachment"("publicId");

-- CreateIndex
CREATE INDEX "Evaluation_initiativeId_createdAt_idx" ON "Evaluation"("initiativeId", "createdAt");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorId_idx" ON "Evaluation"("evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_evaluationId_key" ON "Conversation"("evaluationId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "EvaluationCriteria_activo_orden_idx" ON "EvaluationCriteria"("activo", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligentClassification_nombre_key" ON "IntelligentClassification"("nombre");

-- CreateIndex
CREATE INDEX "IntelligentClassification_activo_idx" ON "IntelligentClassification"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "WorkTable_nombre_key" ON "WorkTable"("nombre");

-- CreateIndex
CREATE INDEX "WorkTable_activo_idx" ON "WorkTable"("activo");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "IntelligentClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_workTableId_fkey" FOREIGN KEY ("workTableId") REFERENCES "WorkTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
