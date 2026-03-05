export type CapabilityStatus = "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED";
export type HealthStatus = "UNKNOWN" | "HEALTHY" | "UNHEALTHY" | "DEGRADED";
export type ModelTier = "PREMIUM" | "BALANCED" | "ECONOMY";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  tier: ModelTier;
  status: CapabilityStatus;
  healthStatus: HealthStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  roleId: string;
  workload: number;
  defaultModelId?: string;
}

export interface RoleAssignmentAgent {
  agentId: string;
  modelId: string;
  priority: number;
}

export interface RoleAssignment {
  roleId: string;
  agents: RoleAssignmentAgent[];
}

export interface ValidationErrorDetail {
  field: string;
  reason: string;
}
