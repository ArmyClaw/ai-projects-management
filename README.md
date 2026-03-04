# Agent Team Builder

## Current Status
- Docs are ready under `doc/design`.
- Engineering scaffold is initialized for `backend` and `web`.
- MVP API is backed by Prisma, defaulting to PostgreSQL and supporting MySQL initialization.

## Run (after installing dependencies)
1. `npm install`
2. Configure DB from `backend/.env.example` (PostgreSQL) or `backend/.env.mysql.example` (MySQL)
3. Initialize schema with `npm --workspace backend run db:init`
4. (Optional, PostgreSQL migration workflow) `npm --workspace backend run prisma:migrate`
5. `npm run dev:backend`
6. `npm run dev:web`

## Database Config
- Default: `DATABASE_PROVIDER=postgresql` with `backend/prisma/schema.prisma`
- MySQL: set `DATABASE_PROVIDER=mysql` and run `npm --workspace backend run db:init`
- Init script auto-selects schema:
  - PostgreSQL: `backend/prisma/schema.prisma`
  - MySQL: `backend/prisma/schema.mysql.prisma`

## MVP Scope in Code
- Model Library API
- Skill Library API (Markdown definition editor)
- Role-group Agent config (shared skill/workflow + PRIMARY/ASSISTANT model config)
- Project bootstrap validation for PRIMARY/ASSISTANT model rules

## Implemented Endpoints
- `GET /health`
- `GET/POST /api/v1/models`
- `POST /api/v1/models/:id/health-check`
- `POST /api/v1/models/:id/publish`
- `GET/POST /api/v1/skills`
- `GET /api/v1/skills/:id`
- `POST /api/v1/skills/:id/publish`
- `POST /api/v1/skills/:id/deprecate`
- `GET/POST /api/v1/agents`
- `PATCH /api/v1/agents/:id/model`
- `PATCH /api/v1/agents/:id/capabilities`
- `GET /api/v1/agents/role-groups`
- `PUT /api/v1/agents/role-groups/:roleId/config`
- `POST /api/v1/projects/bootstrap/validate`
- `PUT /api/v1/projects/:id/role-agents`
- `GET /api/v1/audit-logs`

## Notes
- Prisma schema: `backend/prisma/schema.prisma`
- Migration SQL draft: `backend/prisma/migrations/202603010001_init/migration.sql`
- Frontend bootstrap wizard is at `/bootstrap` with 5-step visual flow.
