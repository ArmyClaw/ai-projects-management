-- CreateTable
CREATE TABLE "Skill" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" "CapabilityStatus" NOT NULL DEFAULT 'DRAFT',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "definition" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX "Skill_name_version_key"
ON "Skill"("name", "version");

CREATE INDEX "Skill_status_idx"
ON "Skill"("status");
