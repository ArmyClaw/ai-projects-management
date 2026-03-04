-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Agent" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "AgentRoleProfile" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "AgentRoleProfile" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "Mcp" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Mcp" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "Model" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Model" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Project" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "ProjectRoleAgent" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "ProjectRoleAgent" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Skill" ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT 'system';

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
