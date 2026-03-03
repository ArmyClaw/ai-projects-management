-- Minimal schema draft for core model-related MVP.
-- This is a starter SQL script and should later be replaced by ORM migrations.

create table if not exists models (
  id text primary key,
  name text not null,
  provider text not null,
  model_id text not null,
  tier text not null check (tier in ('PREMIUM', 'BALANCED', 'ECONOMY')),
  status text not null check (status in ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED')),
  health_status text not null check (health_status in ('UNKNOWN', 'HEALTHY', 'UNHEALTHY', 'DEGRADED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agents (
  id text primary key,
  name text not null,
  role_id text not null,
  workload int not null check (workload between 0 and 100),
  default_model_id text references models(id)
);

create table if not exists project_role_agents (
  id text primary key,
  project_id text not null,
  role_id text not null,
  agent_id text not null references agents(id),
  assignment_role text not null check (assignment_role in ('PRIMARY', 'ASSISTANT')),
  model_id text not null references models(id),
  priority int not null check (priority > 0)
);

create unique index if not exists uq_project_role_primary
  on project_role_agents(project_id, role_id)
  where assignment_role = 'PRIMARY';
