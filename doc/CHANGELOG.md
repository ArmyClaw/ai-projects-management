# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.0] - 2026-02-19

### Added

#### CLI Commands (16 total)
- `version` - Display version information
- `help` - Display help information
- `task list` - List available tasks
- `task claim <id>` - Claim a task
- `task submit <id>` - Submit completed task
- `task detail <id>` - Show task details
- `project list` - List projects
- `project info <id>` - Show project details
- `project create` - Create new project (interactive)
- `project delete <id>` - Delete project
- `skill list` - List available skills
- `skill export <id>` - Export skill details
- `skill import <file>` - Import skill file
- `skill validate <file>` - Validate skill file
- `review status` - Show review status
- `interactive` - Interactive menu mode

#### Backend API (45 endpoints)
- **Project Management**: 5 endpoints (CRUD + list)
- **Task Management**: 5 endpoints (CRUD + detail)
- **User Authentication**: 4 endpoints (register, login, logout, me)
- **GitHub OAuth**: 4 endpoints (URL, callback, token, user)
- **Token Refresh**: 2 endpoints (refresh, verify)
- **Skill Management**: 5 endpoints (CRUD + list)
- **Points System**: 2 endpoints (balance, transactions)
- **Review System**: 2 endpoints (submit, review)
- **Settlement System**: 2 endpoints (create, list)
- **Dispute System**: 3 endpoints (create, list, arbitrate)
- **Anti-Cheat System**: 4 endpoints (skill-test, portfolio-verify, limits, report)
- **AIAgent**: 3 endpoints (create, list, action)

#### Frontend (5 pages + 4 stores)
- **Pages**:
  - HomeView - Home page with feature showcase
  - ProjectsView - Project list and management
  - TasksView - Task hall with filtering
  - SkillsView - Skill marketplace
  - ProfileView - User profile and statistics

- **Stores**:
  - UserStore - User authentication state
  - ProjectStore - Project state management
  - TaskStore - Task state management
  - ThemeStore - Theme state management

#### Theme System
- Light mode support
- Dark mode support
- Auto mode (follow system preference)
- localStorage persistence
- Naive UI dark theme integration

#### Authentication
- GitHub OAuth 2.0 integration
- JWT dual-token mechanism (Access + Refresh)
- Token blacklist for logout
- HttpOnly cookie storage for Refresh Token
- CSRF protection with state parameter

### Changed

- Upgraded to Vue 3 Composition API
- Migrated from Vuex to Pinia for state management
- Enhanced TypeScript strict mode coverage

### Deprecated

- None

### Removed

- None

### Fixed

- None (v1.0.0 initial release)

### Security

- GitHub OAuth 2.0 secure authentication
- JWT token management with automatic refresh
- Secure cookie handling
- Input validation on all endpoints

### Performance

- Fastify high-performance backend
- Optimized database queries with Prisma
- Lazy loading for frontend components

---

## Previous Versions

- No previous versions before v1.0.0

---

## v1.0.0 Release Notes Summary

### Core Features
- ✅ 16 CLI Commands
- ✅ 45 Backend API Endpoints
- ✅ 5 Frontend Pages
- ✅ 4 Pinia Stores
- ✅ 130 Test Cases (100% passing)

### Tech Stack
- **Backend**: Fastify + Prisma + PostgreSQL
- **Frontend**: Vue 3 + Pinia + Naive UI
- **Authentication**: JWT + GitHub OAuth
- **Testing**: Vitest (130 tests)

### Development Metrics
- **Development Duration**: 10 hours 15 minutes
- **Total Iterations**: 41
- **Git Commits**: 53
- **Code Lines**: ~12,000

---

## How to Upgrade

To upgrade from a previous version, please refer to the [Upgrade Guide](./UPGRADE.md).

## Breaking Changes

v1.0.0 is the first release, so there are no breaking changes.

## Known Issues

For known issues, please check our [Issue Tracker](./issues).

## Thank You

Thank you to all contributors and users who made this project possible!
