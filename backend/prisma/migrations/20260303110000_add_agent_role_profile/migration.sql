-- CreateTable
CREATE TABLE "AgentRoleProfile" (
  "roleId" TEXT PRIMARY KEY,
  "skillIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "workflow" JSONB,
  "primaryModelId" TEXT NOT NULL,
  "assistantModelId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Foreign keys
ALTER TABLE "AgentRoleProfile"
ADD CONSTRAINT "AgentRoleProfile_primaryModelId_fkey"
FOREIGN KEY ("primaryModelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgentRoleProfile"
ADD CONSTRAINT "AgentRoleProfile_assistantModelId_fkey"
FOREIGN KEY ("assistantModelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "AgentRoleProfile_primaryModelId_idx"
ON "AgentRoleProfile"("primaryModelId");

CREATE INDEX "AgentRoleProfile_assistantModelId_idx"
ON "AgentRoleProfile"("assistantModelId");
