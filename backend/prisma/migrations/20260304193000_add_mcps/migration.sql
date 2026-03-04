-- CreateTable
CREATE TABLE "Mcp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transport" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" "CapabilityStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mcp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mcp_name_endpoint_key" ON "Mcp"("name", "endpoint");

-- CreateIndex
CREATE INDEX "Mcp_status_idx" ON "Mcp"("status");
