# Agent Team Builder

## Current Status
- Docs are ready under `doc/design`.
- Engineering scaffold is initialized for `backend` and `web`.
- MVP API is now backed by PostgreSQL + Prisma.

## Run (after installing dependencies)
1. `npm install`
2. Configure DB URL from `backend/.env.example`
3. `npm --workspace backend run prisma:generate`
4. `npm --workspace backend run prisma:migrate`
5. `npm run dev:backend`
6. `npm run dev:web`

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
