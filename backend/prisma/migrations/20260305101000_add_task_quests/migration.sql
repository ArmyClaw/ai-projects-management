-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('OPEN', 'ADOPTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestApplicationStatus" AS ENUM ('APPLIED', 'ADOPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "TaskQuest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'OPEN',
    "publisherId" TEXT NOT NULL,
    "adoptedApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskQuestApplication" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" "QuestApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskQuestApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskQuest_publisherId_status_idx" ON "TaskQuest"("publisherId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskQuestApplication_taskId_projectId_key" ON "TaskQuestApplication"("taskId", "projectId");

-- CreateIndex
CREATE INDEX "TaskQuestApplication_applicantId_idx" ON "TaskQuestApplication"("applicantId");

-- AddForeignKey
ALTER TABLE "TaskQuestApplication" ADD CONSTRAINT "TaskQuestApplication_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskQuestApplication" ADD CONSTRAINT "TaskQuestApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
