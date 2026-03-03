-- CreateEnum
CREATE TYPE "CapabilityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');
CREATE TYPE "HealthStatus" AS ENUM ('UNKNOWN', 'HEALTHY', 'UNHEALTHY', 'DEGRADED');
CREATE TYPE "ModelTier" AS ENUM ('PREMIUM', 'BALANCED', 'ECONOMY');
CREATE TYPE "AssignmentRole" AS ENUM ('PRIMARY', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Model" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "tier" "ModelTier" NOT NULL,
  "status" "CapabilityStatus" NOT NULL DEFAULT 'DRAFT',
  "healthStatus" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Agent" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "workload" INTEGER NOT NULL,
  "defaultModelId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ProjectRoleAgent" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "assignmentRole" "AssignmentRole" NOT NULL,
  "modelId" TEXT NOT NULL,
  "priority" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "beforeData" JSONB,
  "afterData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys
ALTER TABLE "Agent"
ADD CONSTRAINT "Agent_defaultModelId_fkey"
FOREIGN KEY ("defaultModelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectRoleAgent"
ADD CONSTRAINT "ProjectRoleAgent_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectRoleAgent"
ADD CONSTRAINT "ProjectRoleAgent_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectRoleAgent"
ADD CONSTRAINT "ProjectRoleAgent_modelId_fkey"
FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE UNIQUE INDEX "ProjectRoleAgent_projectId_roleId_agentId_key"
ON "ProjectRoleAgent"("projectId", "roleId", "agentId");

CREATE INDEX "ProjectRoleAgent_projectId_roleId_idx"
ON "ProjectRoleAgent"("projectId", "roleId");

CREATE INDEX "ProjectRoleAgent_projectId_roleId_assignmentRole_idx"
ON "ProjectRoleAgent"("projectId", "roleId", "assignmentRole");

-- Critical business constraint: one PRIMARY per project-role
CREATE UNIQUE INDEX "uq_project_role_primary"
ON "ProjectRoleAgent"("projectId", "roleId")
WHERE "assignmentRole" = 'PRIMARY';
